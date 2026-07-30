import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  EvolutionOutcomeTransactionCommittedPostcheckError,
} from './aiGovernanceEvolutionOutcomeTransactionFailure.mjs';

const transactionId = `txn-${'a'.repeat(32)}`;

test('committed postcheck error 只暴露固定原因与真实双 ledger mutation', () => {
  const error = new EvolutionOutcomeTransactionCommittedPostcheckError(transactionId);

  assert.equal(error instanceof Error, true);
  assert.equal(error.message, 'outcome transaction committed but postcheck failed');
  assert.deepEqual(Object.keys(error).sort(), [
    'ledgerMutationPerformed', 'ledgerMutations', 'reasonCode', 'transactionId',
  ]);
  assert.equal(error.reasonCode, 'committed-but-postcheck-failed');
  assert.equal(error.transactionId, transactionId);
  assert.equal(error.ledgerMutationPerformed, true);
  assert.deepEqual(error.ledgerMutations, { receipts: true, outcomes: true });
  assert.equal(Object.isFrozen(error.ledgerMutations), true);
  assert.equal(Object.isFrozen(error), true);
});

test('committed postcheck error 拒绝非法 transaction id 且不接受 cause 正文', () => {
  assert.throws(
    () => new EvolutionOutcomeTransactionCommittedPostcheckError('txn-invalid'),
    /committed postcheck transaction id 非法/,
  );
  const error = new EvolutionOutcomeTransactionCommittedPostcheckError(transactionId);
  assert.equal(Object.hasOwn(error, 'cause'), false);
});
