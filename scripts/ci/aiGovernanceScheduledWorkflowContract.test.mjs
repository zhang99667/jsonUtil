import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AI_GOVERNANCE_SCHEDULED_WORKFLOW,
  collectAiGovernanceScheduledWorkflowFailures,
} from './aiGovernanceScheduledWorkflowContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const validWorkflow = [
  'on:',
  '  schedule:',
  "    - cron: '17 3 * * 1'",
  '  workflow_dispatch:',
  'jobs:',
  '  ai-governance:',
  '    steps:',
  '      - run: node scripts/ci/check-version-consistency.mjs',
  '      - run: node --test scripts/ci/*.test.mjs',
  '      - run: node --test scripts/mcp/*.test.mjs',
  '      - run: node scripts/ci/write-ai-governance-artifacts.mjs',
  '      - uses: actions/upload-artifact@v7',
  '        with:',
  '          path: artifacts/ai-governance',
].join('\n');

test('AI governance scheduled workflow accepts schedule, commands and artifact upload', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, AI_GOVERNANCE_SCHEDULED_WORKFLOW, validWorkflow);
    assert.deepEqual(collectAiGovernanceScheduledWorkflowFailures(rootDir), []);
  });
});

test('AI governance scheduled workflow reports missing trigger, command and artifact upload', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, AI_GOVERNANCE_SCHEDULED_WORKFLOW, [
      'on:',
      '  workflow_dispatch:',
      'jobs:',
      '  ai-governance:',
      '    steps:',
      '      - run: node scripts/ci/check-version-consistency.mjs',
    ].join('\n'));

    assert.deepEqual(collectAiGovernanceScheduledWorkflowFailures(rootDir), [
      `${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 必须配置 cron schedule`,
      `${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 缺少定时治理命令 "node --test scripts/ci/*.test.mjs"`,
      `${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 缺少定时治理命令 "node --test scripts/mcp/*.test.mjs"`,
      `${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 缺少定时治理命令 "node scripts/ci/write-ai-governance-artifacts.mjs"`,
      `${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 必须上传 AI governance artifacts`,
    ]);
  });
});
