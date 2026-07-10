import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
  COMPLETE_CODEX_SKILL_SECTION_BODIES,
} from './aiGovernanceSkillTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

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
