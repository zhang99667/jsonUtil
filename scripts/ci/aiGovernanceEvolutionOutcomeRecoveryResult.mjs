const RECOVERY_RESULT_FIELDS = ['status', 'transactionId', 'ledgerMutationPerformed', 'ledgerMutations'];
const LEDGER_MUTATION_FIELDS = ['receipts', 'outcomes'];
const RECOVERY_STATUSES = new Set(['none', 'abandoned-source-drift', 'recovered', 'recovered-stale']);

const exactFields = (value, fields) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join('\0') === [...fields].sort().join('\0');

export const buildEvolutionOutcomeRecoveryResult = ({
  status, transactionId = null, receipts = false, outcomes = false,
}) => ({
  status,
  transactionId,
  ledgerMutationPerformed: receipts || outcomes,
  ledgerMutations: { receipts, outcomes },
});

export const getEvolutionOutcomeRecoveryMutationPerformed = (result) => {
  if (!exactFields(result, RECOVERY_RESULT_FIELDS) || !RECOVERY_STATUSES.has(result.status)
    || !exactFields(result.ledgerMutations, LEDGER_MUTATION_FIELDS)
    || typeof result.ledgerMutationPerformed !== 'boolean'
    || typeof result.ledgerMutations.receipts !== 'boolean' || typeof result.ledgerMutations.outcomes !== 'boolean') {
    throw new Error('outcome transaction recovery result 字段非法');
  }
  const mutation = result.ledgerMutations.receipts || result.ledgerMutations.outcomes;
  const transactionIdValid = result.status === 'none' ? result.transactionId === null
    : /^txn-[0-9a-f]{32}$/.test(result.transactionId ?? '');
  if (!transactionIdValid || result.ledgerMutationPerformed !== mutation
    || (['none', 'abandoned-source-drift'].includes(result.status) && mutation)
    || (result.ledgerMutations.receipts && !result.ledgerMutations.outcomes)) {
    throw new Error('outcome transaction recovery result 语义非法');
  }
  return result.ledgerMutationPerformed;
};
