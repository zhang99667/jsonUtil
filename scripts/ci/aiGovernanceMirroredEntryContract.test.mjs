import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';
import { mirroredAgentSection, writeMirroredEntryFixture } from './aiGovernanceMirroredEntryTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理同源入口检查会报告 AGENTS 与 CLAUDE 协作章节漂移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);
    writeFixtureFile(rootDir, 'CLAUDE.md', mirroredAgentSection.replace('下一步建议：', ''));

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      'CLAUDE.md: ## AI 协作与子 Agent 委派 与 AGENTS.md 的 ## AI 协作与子 Agent 委派 不一致',
    ]);
  });
});

test('AI 治理同源入口检查接受所有工具入口共享核心片段', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), []);
  });
});
