import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectOutcomeWriterAutomationWriteFailures } from './aiGovernanceOutcomeWriterAutomationContract.mjs';
import {
  collectOutcomeWriterAutomationWriteFailures as collectLegacyOutcomeWriterFailures,
} from './aiGovernanceScheduledWorkflowContract.mjs';

const WORKFLOW_FILE = '.github/workflows/fixture.yml';
const OUTCOME_WRITERS = [
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
  'scripts/ci/record-ai-evolution-paired-outcome.mjs',
];

test('scheduled workflow 模块保持 outcome writer 安全 API 的同引用重导出', () => {
  assert.equal(collectLegacyOutcomeWriterFailures, collectOutcomeWriterAutomationWriteFailures);
});

test('outcome writer 只拒绝 writer command block 内的独立 --write 参数', () => {
  for (const writer of OUTCOME_WRITERS) {
    for (const argument of ['--write', '--wri""te', '--wri\\te']) assert.deepEqual(
      collectOutcomeWriterAutomationWriteFailures([`node ${writer} ${argument}`], WORKFLOW_FILE),
      [`${WORKFLOW_FILE}: CI/workflow/local-ci 禁止 outcome writer --write`]);
    assert.deepEqual(
      collectOutcomeWriterAutomationWriteFailures([`node ${writer} --writeback`], WORKFLOW_FILE),
      [],
    );
  }
  assert.deepEqual(
    collectOutcomeWriterAutomationWriteFailures(['node scripts/ci/other-command.mjs --write'], WORKFLOW_FILE),
    [],
  );
});
