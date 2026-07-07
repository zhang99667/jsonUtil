import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { discoverCodexSkillFiles } from './aiGovernanceChecks.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const buildSkillFixtureContent = ({
  frontmatter = [
    'name: jsonutils-maintainer',
    'description: JSONUtils 项目维护技能。',
  ].join('\n'),
  sections = [
    '## 必读文件',
    '## 工作流',
    '## 常用验证命令',
    '## 重点边界',
  ],
  sectionBodies,
} = {}) => [
  '---',
  frontmatter,
  '---',
  '',
  '# JSONUtils Maintainer',
  '',
  ...sections.flatMap(section => [section, sectionBodies?.[section] ?? '', '']),
].join('\n');

const completeSkillSectionBodies = {
  '## 必读文件': [
    'AGENTS.md',
    'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md',
    'docs/AI-ASSET-REGISTRY.md',
  ].join('\n'),
  '## 工作流': [
    'git status --short --branch',
    '子 Agent 委派',
    'frontend/package.json',
    'CHANGELOG.md',
    '规则/skill 回写',
    '决策记录',
    '回写追踪',
    '锁定测试',
  ].join('\n'),
  '## 常用验证命令': [
    'node scripts/ci/check-version-consistency.mjs',
    'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-maintainability-budgets.mjs',
    'npm run build',
  ].join('\n'),
  '## 重点边界': [
    'dispatchChunkLoadRecoveryEvent',
    'Content-Type',
    '本地规则优先',
    'node scripts/ci/check-ai-governance.mjs',
  ].join('\n'),
};

const skillFile = '.codex/skills/jsonutils-maintainer/SKILL.md';

test('AI 治理 skill 发现只收集技能目录下的 SKILL.md', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, 'skill');
    writeFixtureFile(rootDir, '.codex/skills/not-a-skill.txt', 'ignore');

    assert.deepEqual(discoverCodexSkillFiles(rootDir), [skillFile]);
  });
});

test('AI 治理 skill 契约会报告缺失 frontmatter', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, [
      '# JSONUtils Maintainer',
      '## 必读文件',
      completeSkillSectionBodies['## 必读文件'],
      '## 工作流',
      completeSkillSectionBodies['## 工作流'],
      '## 常用验证命令',
      completeSkillSectionBodies['## 常用验证命令'],
      '## 重点边界',
      completeSkillSectionBodies['## 重点边界'],
    ].join('\n'));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 缺少 skill frontmatter`,
    ]);
  });
});

test('AI 治理 skill 契约会报告缺失 frontmatter 字段', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      frontmatter: 'name: jsonutils-maintainer',
      sectionBodies: completeSkillSectionBodies,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter 缺少 description`,
    ]);
  });
});

test('AI 治理 skill 契约会报告 frontmatter name 与目录不一致', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      frontmatter: [
        'name: stale-skill',
        'description: JSONUtils 项目维护技能。',
      ].join('\n'),
      sectionBodies: completeSkillSectionBodies,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter name 必须等于 skill 目录名 jsonutils-maintainer`,
    ]);
  });
});

test('AI 治理 skill 契约会报告缺失核心章节', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sections: ['## 必读文件', '## 工作流', '## 重点边界'],
      sectionBodies: completeSkillSectionBodies,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 缺少 ## 常用验证命令 章节`,
    ]);
  });
});

test('AI 治理 skill 契约会忽略正文里的伪章节标题', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sections: ['## 必读文件', '## 常用验证命令', '## 重点边界'],
      sectionBodies: {
        ...completeSkillSectionBodies,
        '## 必读文件': `${completeSkillSectionBodies['## 必读文件']}\n正文提到 ## 工作流 不是章节标题`,
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 缺少 ## 工作流 章节`,
    ]);
  });
});

test('AI 治理 skill 契约会报告核心章节缺少关键内容', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sectionBodies: {
        ...completeSkillSectionBodies,
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
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sectionBodies: {
        ...completeSkillSectionBodies,
        '## 必读文件': `${completeSkillSectionBodies['## 必读文件']}\n- \`docs/AI-MISSING.md\``,
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 引用的项目路径不存在 \`docs/AI-MISSING.md\``,
    ]);
  });
});

test('AI 治理 skill 契约会报告不存在的验证脚本引用', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sectionBodies: {
        ...completeSkillSectionBodies,
        '## 常用验证命令': [
          completeSkillSectionBodies['## 常用验证命令'],
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

test('AI 治理 skill 契约接受存在的 fenced npm run 脚本', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
      scripts: { build: 'vite build', test: 'vitest run' },
    }));
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sectionBodies: {
        ...completeSkillSectionBodies,
        '## 常用验证命令': [
          completeSkillSectionBodies['## 常用验证命令'],
          '```bash',
          'cd frontend',
          'npm run build',
          'npm run test -- src/utils/schemeUtils.test.ts',
          '```',
        ].join('\n'),
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), []);
  });
});

test('AI 治理 skill 契约会报告不存在的 fenced npm run 脚本', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
      scripts: { build: 'vite build' },
    }));
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sectionBodies: {
        ...completeSkillSectionBodies,
        '## 常用验证命令': [
          completeSkillSectionBodies['## 常用验证命令'],
          '```bash',
          'cd frontend',
          'npm run missing-script -- --strict',
          '```',
        ].join('\n'),
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: npm 脚本不存在 \`missing-script\``,
    ]);
  });
});
