import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { CODEX_SKILL_CONTRACT_COLLECTORS } from './aiGovernanceCodexSkillContractCollectors.mjs';
import { discoverCodexSkillFiles } from './aiGovernanceChecks.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
  COMPLETE_CODEX_SKILL_SECTION_BODIES,
  withCodexSkillTempRoot,
} from './aiGovernanceSkillTestFixtures.mjs';
import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

test('AI 治理 skill 契约收集器列表固定且不可变', () => {
  assert.equal(CODEX_SKILL_CONTRACT_COLLECTORS.length, 10);
  assert.equal(Object.isFrozen(CODEX_SKILL_CONTRACT_COLLECTORS), true);
  assert.throws(() => CODEX_SKILL_CONTRACT_COLLECTORS.pop(), TypeError);
});

test('AI 治理 skill 发现只收集技能目录下的 SKILL.md', () => {
  withCodexSkillTempRoot((rootDir) => {
    writeFixtureFile(rootDir, CODEX_SKILL_TEST_FILE, 'skill');
    writeFixtureFile(rootDir, '.agents/skills/not-a-skill.txt', 'ignore');

    assert.deepEqual(discoverCodexSkillFiles(rootDir), [CODEX_SKILL_TEST_FILE]);
  });
});

test('AI 治理 skill 契约按收集器顺序报告缺失章节与不存在的项目路径引用', () => {
  withCodexSkillTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      sections: Object.keys(COMPLETE_CODEX_SKILL_SECTION_BODIES).filter(section => section !== '## 重点边界'),
      sectionBodies: {
        ...COMPLETE_CODEX_SKILL_SECTION_BODIES,
        '## 按任务读取': `${COMPLETE_CODEX_SKILL_SECTION_BODIES['## 按任务读取']}\n- \`docs/AI-MISSING.md\``,
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 缺少 ## 重点边界 章节`,
      `${skillFile}: 引用的项目路径不存在 \`docs/AI-MISSING.md\``,
    ]);
  });
});

test('AI 治理 skill 契约会报告不存在的验证脚本引用', () => {
  withCodexSkillTempRoot((rootDir) => {
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
