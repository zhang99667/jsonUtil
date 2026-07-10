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
