import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
  COMPLETE_CODEX_SKILL_SECTION_BODIES,
} from './aiGovernanceSkillTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理 skill 契约会忽略正文里的伪章节标题', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, CODEX_SKILL_TEST_FILE, buildCodexSkillFixtureContent({
      sections: ['## 必读文件', '## 常用验证命令', '## 重点边界'],
      sectionBodies: {
        ...COMPLETE_CODEX_SKILL_SECTION_BODIES,
        '## 必读文件': `${COMPLETE_CODEX_SKILL_SECTION_BODIES['## 必读文件']}\n正文提到 ## 工作流 不是章节标题`,
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [CODEX_SKILL_TEST_FILE]), [
      `${CODEX_SKILL_TEST_FILE}: 缺少 ## 工作流 章节`,
    ]);
  });
});
