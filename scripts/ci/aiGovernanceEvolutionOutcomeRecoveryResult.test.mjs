import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildEvolutionOutcomeRecoveryResult,
  getEvolutionOutcomeRecoveryMutationPerformed,
} from './aiGovernanceEvolutionOutcomeRecoveryResult.mjs';
import {
  getEvolutionOutcomeRecoveryMutationPerformed as getMutationFromTransaction,
} from './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';

const transactionId = `txn-${'a'.repeat(32)}`;

test('recovery result 逐 ledger 投影本次 mutation 并保持闭字段', () => {
  assert.equal(getMutationFromTransaction, getEvolutionOutcomeRecoveryMutationPerformed);
  const cases = [
    [{ status: 'none' }, false, { receipts: false, outcomes: false }],
    [{ status: 'abandoned-source-drift', transactionId }, false, { receipts: false, outcomes: false }],
    [{ status: 'recovered', transactionId }, false, { receipts: false, outcomes: false }],
    [{ status: 'recovered', transactionId, outcomes: true }, true, { receipts: false, outcomes: true }],
    [{ status: 'recovered-stale', transactionId, receipts: true, outcomes: true }, true,
      { receipts: true, outcomes: true }],
  ];

  for (const [input, mutationPerformed, ledgerMutations] of cases) {
    const result = buildEvolutionOutcomeRecoveryResult(input);
    assert.deepEqual(Object.keys(result), [
      'status', 'transactionId', 'ledgerMutationPerformed', 'ledgerMutations',
    ]);
    assert.equal(getEvolutionOutcomeRecoveryMutationPerformed(result), mutationPerformed);
    assert.deepEqual(result.ledgerMutations, ledgerMutations);
  }
});

test('recovery result 拒绝字段漂移、非法身份和不可能的 receipt-only 投影', () => {
  const none = buildEvolutionOutcomeRecoveryResult({ status: 'none' });
  const invalid = [
    { ...none, extra: true },
    { ...none, transactionId },
    { ...none, ledgerMutationPerformed: true },
    { ...none, status: 'future' },
    { ...none, status: 'recovered', transactionId: 'txn-invalid' },
    { ...none, status: 'recovered', transactionId, ledgerMutationPerformed: true,
      ledgerMutations: { receipts: true, outcomes: false } },
  ];

  invalid.forEach(result => assert.throws(
    () => getEvolutionOutcomeRecoveryMutationPerformed(result),
    /outcome transaction recovery result (?:字段|语义)非法/,
  ));
});
