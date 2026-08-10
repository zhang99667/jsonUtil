import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAiGovernanceValidationExecutionFailureReport,
  isClosedAiGovernanceValidationExecutionReport,
} from './aiGovernanceValidationExecutionReceipt.mjs';

test('validation execution failure reports share one closed receipt contract', () => {
  const report = buildAiGovernanceValidationExecutionFailureReport({
    requested: false,
    blockerCode: 'VALIDATION_PREFLIGHT_FAILED',
  });

  assert.equal(isClosedAiGovernanceValidationExecutionReport(report, false), true);
  assert.equal(report.execution.launchAttemptCount, 0);
  assert.deepEqual(report.blockers, [{ code: 'VALIDATION_PREFLIGHT_FAILED', count: 1 }]);
  assert.equal(Object.values(report.claims).every(value => value === false), true);
});
