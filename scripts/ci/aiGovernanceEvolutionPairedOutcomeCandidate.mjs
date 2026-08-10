import {
  hashEvolutionOutcomeLegacyPrefix,
  hashEvolutionOutcomeV3Line,
} from './aiGovernanceEvolutionOutcomeChain.mjs';
import {
  AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES,
  AI_EVOLUTION_PAIRED_RUNNER,
  AI_EVOLUTION_PAIRED_VALIDATION_COMMAND,
  AI_EVOLUTION_PAIRED_VALIDATION_EVIDENCE,
} from './aiGovernanceEvolutionPairedReceiptV4.mjs';
import { hashEvolutionPairedValue } from './aiGovernanceEvolutionPairedReceiptV4Commitments.mjs';
import { hashEvolutionTrialReceiptLine } from './aiGovernanceEvolutionTrialReceipts.mjs';

const BATCH_REUSE_DOMAIN = 'jsonutils.ai-evolution.paired-batch-reuse/v1';

const appendJsonLine = (base, line) => {
  const separator = base.length > 0 && base.at(-1) !== 0x0a ? '\n' : '';
  return Buffer.from(`${separator}${line}\n`, 'utf8');
};

const lineageKey = value => JSON.stringify([value.caseId, value.caseVersion, value.subjectVersion]);

export const findLatestEvolutionPairedLineageOutcome = (outcomes, value) => {
  const latest = new Map();
  outcomes.forEach(outcome => latest.set(lineageKey(outcome), outcome));
  return latest.get(lineageKey(value));
};

export const batchProjectionFromReceipt = receipt => ({
  schemaVersion: 1,
  artifactType: 'ai-evolution-paired-trial-batch',
  dataClass: receipt.dataClass,
  experimentRef: receipt.experimentRef,
  caseRef: receipt.caseRef,
  fixtureRef: receipt.fixtureRef,
  environmentRef: receipt.environmentRef,
  policyRef: receipt.policyRef,
  rubricSha256: receipt.rubricSha256,
  assignment: receipt.assignment,
  checkpoint: receipt.checkpoint,
  trialResults: receipt.trialResults,
  proof: receipt.proof,
});

const batchDigest = batch => hashEvolutionPairedValue(BATCH_REUSE_DOMAIN, batch);

export const isEvolutionPairedBatchReusable = ({
  previous, receiptsById, batch, baseReport,
}) => {
  if (!previous || !baseReport.scoredOutcomeIds.includes(previous.id)) return false;
  const receipt = receiptsById.get(previous.evidence?.receiptId)?.receipt;
  return receipt?.schemaVersion === 4
    && batchDigest(batchProjectionFromReceipt(receipt)) === batchDigest(batch);
};

const feedbackFor = (aggregate) => {
  if (aggregate.verdict === 'pass') return undefined;
  return `candidate 三次 paired trial 聚合为 ${aggregate.verdict}/${aggregate.score}，需根据已绑定 rubric 复盘失败项`;
};

export const buildEvolutionPairedOutcomeCandidate = ({
  verification, evaluatedAt, corpusVersion, revision, state, receiptsBefore, outcomesBefore,
}) => {
  const { batch, aggregate, context } = verification;
  const caseItem = context.caseItem;
  const sequence = state.outcomeResult.outcomes.length + 1;
  const suffix = `${evaluatedAt}-s${sequence}`;
  const receiptId = `receipt-${caseItem.id}-paired-v${caseItem.caseVersion}-${suffix}`;
  const outcomeId = `${caseItem.id}-paired-v${caseItem.caseVersion}-${suffix}`;
  if (state.receiptResult.receiptsById.has(receiptId)
    || state.outcomeResult.outcomes.some(item => item.id === outcomeId)) {
    throw new Error('paired outcome writer id 冲突');
  }
  const validation = {
    command: AI_EVOLUTION_PAIRED_VALIDATION_COMMAND,
    status: 'passed', evidence: AI_EVOLUTION_PAIRED_VALIDATION_EVIDENCE, checkedAt: evaluatedAt,
  };
  const receipt = {
    schemaVersion: 4,
    id: receiptId,
    artifactType: 'ai-evolution-trial-receipt',
    dataClass: 'redacted',
    caseId: caseItem.id,
    corpusVersion,
    caseVersion: caseItem.caseVersion,
    subjectVersion: caseItem.subject.version,
    evaluatedAt,
    method: 'hybrid',
    source: 'manual',
    runner: AI_EVOLUTION_PAIRED_RUNNER,
    revision,
    aggregation: 'candidate-only-v1',
    trialResults: structuredClone(batch.trialResults),
    validations: [validation],
    experimentRef: structuredClone(batch.experimentRef),
    caseRef: structuredClone(batch.caseRef),
    fixtureRef: structuredClone(batch.fixtureRef),
    environmentRef: structuredClone(batch.environmentRef),
    policyRef: structuredClone(batch.policyRef),
    rubricSha256: batch.rubricSha256,
    assignment: structuredClone(batch.assignment),
    checkpoint: structuredClone(batch.checkpoint),
    proof: structuredClone(batch.proof),
  };
  const receiptLine = JSON.stringify(receipt);
  if (Buffer.byteLength(receiptLine, 'utf8') > AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES) {
    throw new Error('paired receipt v4 超过 512 KiB 上限');
  }
  const previous = findLatestEvolutionPairedLineageOutcome(
    state.outcomeResult.validOutcomes,
    receipt,
  );
  const outcomeLines = outcomesBefore.bytes.toString('utf8').split(/\r?\n/).filter(line => line.trim());
  const previousV3Line = state.outcomeResult.outcomes.at(-1)?.schemaVersion === 3
    ? outcomeLines.at(-1) : null;
  const outcome = {
    schemaVersion: 3,
    id: outcomeId,
    caseId: caseItem.id,
    corpusVersion,
    caseVersion: caseItem.caseVersion,
    subjectVersion: caseItem.subject.version,
    evaluatedAt,
    verdict: aggregate.verdict,
    score: aggregate.score,
    ...(feedbackFor(aggregate) ? { feedback: feedbackFor(aggregate) } : {}),
    provenance: {
      method: 'hybrid', source: 'manual', runner: AI_EVOLUTION_PAIRED_RUNNER,
      revision, trials: 3,
    },
    evidence: { receiptId, sha256: hashEvolutionTrialReceiptLine(receiptLine) },
    writeback: { files: [], validationResults: [validation] },
    chain: {
      sequence,
      previousHash: previousV3Line === null
        ? hashEvolutionOutcomeLegacyPrefix(outcomeLines) : hashEvolutionOutcomeV3Line(previousV3Line),
    },
    supersession: {
      previousOutcomeId: previous?.id ?? null,
      feedbackDisposition: aggregate.verdict !== 'pass'
        ? 'open' : previous && ['fail', 'partial'].includes(previous.verdict) ? 'resolved' : 'none',
      summary: previous
        ? '受信 paired v4 batch 显式接续同 lineage 直接前序；只按三次 candidate trial 归约'
        : '首次记录受信 paired v4 batch；baseline 仅作比较，三次 candidate trial 进入 outcome',
    },
  };
  const outcomeLine = JSON.stringify(outcome);
  return {
    receipt, receiptLine, outcome, outcomeLine, previous,
    receiptSuffix: appendJsonLine(receiptsBefore.bytes, receiptLine),
    outcomeSuffix: appendJsonLine(outcomesBefore.bytes, outcomeLine),
  };
};
