import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { discoverCodexSkillFiles } from './aiGovernanceChecks.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
  COMPLETE_CODEX_SKILL_SECTION_BODIES,
} from './aiGovernanceSkillTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

test('AI 治理 skill 发现只收集技能目录下的 SKILL.md', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, CODEX_SKILL_TEST_FILE, 'skill');
    writeFixtureFile(rootDir, '.codex/skills/not-a-skill.txt', 'ignore');

    assert.deepEqual(discoverCodexSkillFiles(rootDir), [CODEX_SKILL_TEST_FILE]);
  });
});

test('AI 治理 skill 契约会报告缺失 frontmatter', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, [
      '# JSONUtils Maintainer',
      '## 必读文件',
      COMPLETE_CODEX_SKILL_SECTION_BODIES['## 必读文件'],
      '## 工作流',
      COMPLETE_CODEX_SKILL_SECTION_BODIES['## 工作流'],
      '## 常用验证命令',
      COMPLETE_CODEX_SKILL_SECTION_BODIES['## 常用验证命令'],
      '## 重点边界',
      COMPLETE_CODEX_SKILL_SECTION_BODIES['## 重点边界'],
    ].join('\n'));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 缺少 skill frontmatter`,
    ]);
  });
});

test('AI 治理 skill 契约会报告缺失 frontmatter 字段', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: 'name: jsonutils-maintainer',
      sectionBodies: COMPLETE_CODEX_SKILL_SECTION_BODIES,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter 缺少 description`,
      `${skillFile}: frontmatter 缺少 version`,
      `${skillFile}: frontmatter 缺少 tags`,
    ]);
  });
});

test('AI 治理 skill 契约会报告 frontmatter 元数据格式错误', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: [
        'name: jsonutils-maintainer',
        'description: JSONUtils 项目维护技能。',
        'version: latest',
        'tags: governance',
      ].join('\n'),
      sectionBodies: COMPLETE_CODEX_SKILL_SECTION_BODIES,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter version 必须使用 x.y.z 格式`,
      `${skillFile}: frontmatter tags 必须是非空数组`,
    ]);
  });
});

test('AI 治理 skill 契约会报告 frontmatter name 与目录不一致', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: [
        'name: stale-skill',
        'description: JSONUtils 项目维护技能。',
        'version: 0.1.0',
        'tags: [jsonutils, governance, maintenance]',
      ].join('\n'),
      sectionBodies: COMPLETE_CODEX_SKILL_SECTION_BODIES,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter name 必须等于 skill 目录名 jsonutils-maintainer`,
    ]);
  });
});

test('AI 治理 skill 契约会报告缺失核心章节', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      sections: ['## 必读文件', '## 工作流', '## 重点边界'],
      sectionBodies: COMPLETE_CODEX_SKILL_SECTION_BODIES,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 缺少 ## 常用验证命令 章节`,
    ]);
  });
});

test('AI 治理 skill 契约会忽略正文里的伪章节标题', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      sections: ['## 必读文件', '## 常用验证命令', '## 重点边界'],
      sectionBodies: {
        ...COMPLETE_CODEX_SKILL_SECTION_BODIES,
        '## 必读文件': `${COMPLETE_CODEX_SKILL_SECTION_BODIES['## 必读文件']}\n正文提到 ## 工作流 不是章节标题`,
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 缺少 ## 工作流 章节`,
    ]);
  });
});

test('AI 治理 skill 契约会报告核心章节缺少关键内容', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      sectionBodies: {
        ...COMPLETE_CODEX_SKILL_SECTION_BODIES,
        '## 工作流': [
          'git status --short --branch',
          'frontend/package.json',
          'CHANGELOG.md',
          '规则/skill 回写',
          '决策记录',
          '回写追踪',
          '锁定测试',
        ].join('\n'),
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: ## 工作流 缺少 "子 Agent 委派"`,
    ]);
  });
});

test('AI 治理 skill 契约会报告不存在的项目路径引用', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      sectionBodies: {
        ...COMPLETE_CODEX_SKILL_SECTION_BODIES,
        '## 必读文件': `${COMPLETE_CODEX_SKILL_SECTION_BODIES['## 必读文件']}\n- \`docs/AI-MISSING.md\``,
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 引用的项目路径不存在 \`docs/AI-MISSING.md\``,
    ]);
  });
});

test('AI 治理 skill 契约会报告不存在的验证脚本引用', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      sectionBodies: {
        ...COMPLETE_CODEX_SKILL_SECTION_BODIES,
        '## 常用验证命令': [
          COMPLETE_CODEX_SKILL_SECTION_BODIES['## 常用验证命令'],
          '```bash',
          'node scripts/ci/missing-skill-check.mjs',
          '```',
        ].join('\n'),
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 引用的项目路径不存在 \`scripts/ci/missing-skill-check.mjs\``,
    ]);
  });
});
