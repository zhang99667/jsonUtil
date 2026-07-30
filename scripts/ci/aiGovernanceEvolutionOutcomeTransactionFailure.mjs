const TRANSACTION_ID_PATTERN = /^txn-[0-9a-f]{32}$/;

export class EvolutionOutcomeTransactionCommittedPostcheckError extends Error {
  constructor(transactionId) {
    if (!TRANSACTION_ID_PATTERN.test(transactionId ?? '')) {
      throw new Error('committed postcheck transaction id 非法');
    }
    super('outcome transaction committed but postcheck failed');
    this.reasonCode = 'committed-but-postcheck-failed';
    this.transactionId = transactionId;
    this.ledgerMutationPerformed = true;
    this.ledgerMutations = Object.freeze({ receipts: true, outcomes: true });
    Object.freeze(this);
  }
}
