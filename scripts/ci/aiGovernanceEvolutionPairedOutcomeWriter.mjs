import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import { validateEvolutionDeterministicOutcomeCandidate } from './aiGovernanceEvolutionDeterministicOutcomeWriter.mjs';
import {
  acquireEvolutionOutcomeWriterLock,
  commitEvolutionOutcomeTransaction,
  getEvolutionOutcomeRecoveryMutationPerformed,
  readEvolutionOutcomeLedgerSnapshot,
  recoverEvolutionOutcomeTransaction,
} from './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';
import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';
import { hashEvolutionOutcomeV3Line } from './aiGovernanceEvolutionOutcomeChain.mjs';
import { readEvolutionOutcomeLedger } from './aiGovernanceEvolutionOutcomeLedger.mjs';
import {
  verifyEvolutionPairedBatchArtifact,
} from './aiGovernanceEvolutionPairedReceiptV4.mjs';
import {
  batchProjectionFromReceipt,
  buildEvolutionPairedOutcomeCandidate,
  findLatestEvolutionPairedLineageOutcome,
  isEvolutionPairedBatchReusable,
} from './aiGovernanceEvolutionPairedOutcomeCandidate.mjs';
import { readEvolutionTrialReceiptLedger } from './aiGovernanceEvolutionTrialReceipts.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';

export const AI_EVOLUTION_PAIRED_OUTCOME_WRITER_VERSION = '1.1.0';
export { batchProjectionFromReceipt };
const RECEIPTS_RELATIVE_PATH = 'evals/ai-governance/trial-receipts.jsonl';
const OUTCOMES_RELATIVE_PATH = 'evals/ai-governance/outcomes.jsonl';

const withPrivateLedgerCopies = ({ receiptsBytes, outcomesBytes }, callback) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-paired-outcome-preview-'));
  fs.chmodSync(tempDir, 0o700);
  const receiptsPath = path.join(tempDir, 'trial-receipts.jsonl');
  const outcomesPath = path.join(tempDir, 'outcomes.jsonl');
  try {
    fs.writeFileSync(receiptsPath, receiptsBytes, { mode: 0o600, flag: 'wx' });
    fs.writeFileSync(outcomesPath, outcomesBytes, { mode: 0o600, flag: 'wx' });
    return callback({ receiptsPath, outcomesPath });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

const readValidatedState = ({
  rootDir, corpus, evaluatedAt, receiptsBytes, outcomesBytes, pairedTrustPolicy,
}) => withPrivateLedgerCopies({ receiptsBytes, outcomesBytes }, ({ receiptsPath, outcomesPath }) => {
  const receiptResult = readEvolutionTrialReceiptLedger(receiptsPath, {
    rootDir, maxDate: evaluatedAt, pairedTrustPolicy,
  });
  if (receiptResult.failures.length > 0) {
    throw new Error(`receipt ledger 校验失败：${receiptResult.failures[0]}`);
  }
  const outcomeResult = readEvolutionOutcomeLedger(outcomesPath, {
    caseIds: new Set([...corpus.cases.map(item => item.id), ...corpus.retiredCaseIds]),
    maxDate: evaluatedAt,
    rootDir,
    receiptsById: receiptResult.receiptsById,
    currentCorpusVersion: corpus.corpus.corpusVersion,
  });
  if (outcomeResult.failures.length > 0) {
    throw new Error(`outcome ledger 校验失败：${outcomeResult.failures[0]}`);
  }
  return { receiptResult, outcomeResult };
});

const assertDistinctSnapshots = (receipts, outcomes) => {
  if (receipts.endpoint.dev === outcomes.endpoint.dev && receipts.endpoint.ino === outcomes.endpoint.ino) {
    throw new Error('receipt/outcome ledger 不得指向同一 inode');
  }
};

const assertSnapshotUnchanged = (before, after, label) => {
  const sameEndpoint = Object.keys(before.endpoint).every(field => before.endpoint[field] === after.endpoint[field]);
  if (before.absolute !== after.absolute || !sameEndpoint || !before.bytes.equals(after.bytes)) {
    throw new Error(`${label} 在 paired preview 期间发生漂移`);
  }
};

const reportWithoutCandidate = ({ status, verification, corpusVersion, revision, experimentId }) => ({
  schemaVersion: 1,
  reportType: 'ai-evolution-paired-outcome-writer',
  writerVersion: AI_EVOLUTION_PAIRED_OUTCOME_WRITER_VERSION,
  ok: true,
  mode: 'preview',
  status,
  experimentId,
  corpusVersion,
  revision,
  proofStatus: verification.proofVerification.status,
  infrastructureEligible: verification.infrastructureEligible,
  confirmedCoverageEligible: false,
  counts: { candidates: 0, alreadyCurrent: status === 'already-current' ? 1 : 0 },
  ledgerMutationRequested: false,
  ledgerMutationPerformed: false,
});

const assertCandidateSafety = ({ base, candidate, outcome, outcomeLine }) => {
  if (!base?.ok || !candidate?.ok) {
    throw new Error(`paired 候选 ledger 全量校验失败：${candidate?.failures?.[0] ?? '报告不完整'}`);
  }
  for (const key of ['totalOutcomes', 'validOutcomes', 'trialReceipts', 'validTrialReceipts', 'chainedOutcomes']) {
    if (candidate.counts[key] !== base.counts[key] + 1) throw new Error(`paired 候选 ${key} 增量非法`);
  }
  if (candidate.counts.invalidOutcomes !== base.counts.invalidOutcomes
    || candidate.counts.invalidTrialReceipts !== base.counts.invalidTrialReceipts) {
    throw new Error('paired 候选不得增加 invalid ledger 记录');
  }
  if (!candidate.scoredOutcomeIds.includes(outcome.id)
    || !candidate.traceVerifiedOutcomeIds.includes(outcome.id)
    || candidate.unverifiedOutcomeIds.includes(outcome.id)) {
    throw new Error('paired 候选必须进入 verified/scored，且不能进入 unverified');
  }
  if (candidate.ledgerChain.headSequence !== base.ledgerChain.headSequence + 1
    || candidate.ledgerChain.headSha256 !== hashEvolutionOutcomeV3Line(outcomeLine)) {
    throw new Error('paired 候选 outcome chain head 不匹配');
  }
};

export const prepareEvolutionPairedOutcome = ({
  rootDir,
  batch,
  pairedTrustPolicy = {},
  evaluatedAt = getLocalIsoDate(),
  resolveRevision = resolveEvolutionWorktreeRevision,
  validateCandidate = validateEvolutionDeterministicOutcomeCandidate,
} = {}) => {
  const realRoot = fs.realpathSync(rootDir);
  const receiptsPath = path.join(realRoot, RECEIPTS_RELATIVE_PATH);
  const outcomesPath = path.join(realRoot, OUTCOMES_RELATIVE_PATH);
  const receiptsBefore = readEvolutionOutcomeLedgerSnapshot(realRoot, receiptsPath);
  const outcomesBefore = readEvolutionOutcomeLedgerSnapshot(realRoot, outcomesPath);
  assertDistinctSnapshots(receiptsBefore, outcomesBefore);
  const revision = resolveRevision(realRoot);
  const verification = verifyEvolutionPairedBatchArtifact(batch, {
    rootDir: realRoot, expectedRevision: revision, maxDate: evaluatedAt, pairedTrustPolicy,
  });
  if (verification.failures.length > 0) {
    throw new Error(`paired batch 验证失败：${verification.failures[0]}`);
  }
  const corpus = readEvolutionEvalCorpus(path.join(realRoot, 'evals/ai-governance/cases.json'), {
    maxDate: evaluatedAt,
  });
  if (corpus.failures.length > 0) throw new Error(`eval corpus 校验失败：${corpus.failures[0]}`);
  const state = readValidatedState({
    rootDir: realRoot, corpus, evaluatedAt, receiptsBytes: receiptsBefore.bytes,
    outcomesBytes: outcomesBefore.bytes, pairedTrustPolicy,
  });
  const baseReport = validateCandidate({
    rootDir: realRoot, receiptsBytes: receiptsBefore.bytes, outcomesBytes: outcomesBefore.bytes,
    evaluatedAt, revision, pairedTrustPolicy,
  });
  const assertPreviewStable = () => {
    if (resolveRevision(realRoot) !== revision) {
      throw new Error('paired preview 期间 source-state v2 revision 发生漂移');
    }
    const receiptsAfter = readEvolutionOutcomeLedgerSnapshot(realRoot, receiptsPath);
    const outcomesAfter = readEvolutionOutcomeLedgerSnapshot(realRoot, outcomesPath);
    assertDistinctSnapshots(receiptsAfter, outcomesAfter);
    assertSnapshotUnchanged(receiptsBefore, receiptsAfter, 'receipt ledger');
    assertSnapshotUnchanged(outcomesBefore, outcomesAfter, 'outcome ledger');
  };
  const finishWithoutCandidate = (status) => {
    assertPreviewStable();
    return {
      report: reportWithoutCandidate({
        status, verification, corpusVersion: corpus.corpus.corpusVersion,
        revision, experimentId: verification.batch.experimentRef.id,
      }),
      transaction: {
        revision, receiptsPath, outcomesPath, receiptsBase: receiptsBefore.bytes,
        outcomesBase: outcomesBefore.bytes, receiptSuffix: Buffer.alloc(0), outcomeSuffix: Buffer.alloc(0),
      },
    };
  };
  if (!verification.infrastructureEligible) return finishWithoutCandidate('infrastructure-invalid');
  if (!verification.proofVerification.scoringEligible) return finishWithoutCandidate('proof-unverified');
  const previous = findLatestEvolutionPairedLineageOutcome(state.outcomeResult.validOutcomes, {
    caseId: verification.context.caseItem.id,
    caseVersion: verification.context.caseItem.caseVersion,
    subjectVersion: verification.context.caseItem.subject.version,
  });
  if (isEvolutionPairedBatchReusable({
    previous, receiptsById: state.receiptResult.receiptsById,
    batch: verification.batch, baseReport,
  })) return finishWithoutCandidate('already-current');
  const candidate = buildEvolutionPairedOutcomeCandidate({
    verification, evaluatedAt, corpusVersion: corpus.corpus.corpusVersion, revision,
    state, receiptsBefore, outcomesBefore,
  });
  const candidateReport = validateCandidate({
    rootDir: realRoot,
    receiptsBytes: Buffer.concat([receiptsBefore.bytes, candidate.receiptSuffix]),
    outcomesBytes: Buffer.concat([outcomesBefore.bytes, candidate.outcomeSuffix]),
    evaluatedAt, revision, pairedTrustPolicy,
  });
  assertCandidateSafety({
    base: baseReport, candidate: candidateReport,
    outcome: candidate.outcome, outcomeLine: candidate.outcomeLine,
  });
  assertPreviewStable();
  return {
    report: {
      schemaVersion: 1,
      reportType: 'ai-evolution-paired-outcome-writer',
      writerVersion: AI_EVOLUTION_PAIRED_OUTCOME_WRITER_VERSION,
      ok: true,
      mode: 'preview',
      status: 'ready',
      experimentId: verification.batch.experimentRef.id,
      caseId: verification.context.caseItem.id,
      corpusVersion: corpus.corpus.corpusVersion,
      revision,
      proofStatus: verification.proofVerification.status,
      infrastructureEligible: true,
      aggregate: verification.aggregate,
      candidate: {
        receiptId: candidate.receipt.id,
        outcomeId: candidate.outcome.id,
        sequence: candidate.outcome.chain.sequence,
      },
      counts: { candidates: 1, alreadyCurrent: 0 },
      confirmedCoverageEligible: true,
      ledgerMutationRequested: false,
      ledgerMutationPerformed: false,
    },
    transaction: {
      revision, receiptsPath, outcomesPath,
      receiptsBase: receiptsBefore.bytes, outcomesBase: outcomesBefore.bytes,
      receiptSuffix: candidate.receiptSuffix, outcomeSuffix: candidate.outcomeSuffix,
      baseReport, outcome: candidate.outcome, outcomeLine: candidate.outcomeLine,
    },
  };
};

const enabledFlag = value => value !== undefined && value !== null
  && !['', '0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());

const buildPostcheck = ({
  rootDir, evaluatedAt, resolveRevision, pairedTrustPolicy, transaction,
}) => () => {
  try {
    if (resolveRevision(rootDir) !== transaction.revision) {
      throw new Error('paired ledger commit 后 source-state v2 revision 发生漂移');
    }
    const report = buildAiGovernanceEvolutionEvalReport({
      rootDir, maxDate: evaluatedAt, resolveRevision, pairedTrustPolicy,
    });
    assertCandidateSafety({
      base: transaction.baseReport, candidate: report,
      outcome: transaction.outcome, outcomeLine: transaction.outcomeLine,
    });
    return { ok: true, failures: [] };
  } catch (error) {
    return { ok: false, failures: [error instanceof Error ? error.message : String(error)] };
  }
};

export const recordEvolutionPairedOutcome = ({
  rootDir,
  batch,
  pairedTrustPolicy = {},
  write = false,
  evaluatedAt = getLocalIsoDate(),
  env = process.env,
  resolveRevision = resolveEvolutionWorktreeRevision,
  validateCandidate = validateEvolutionDeterministicOutcomeCandidate,
  transactionApi = {
    acquire: acquireEvolutionOutcomeWriterLock,
    recover: recoverEvolutionOutcomeTransaction,
    commit: commitEvolutionOutcomeTransaction,
  },
} = {}) => {
  if (typeof write !== 'boolean') throw new TypeError('write 必须是布尔值');
  if (!write) return prepareEvolutionPairedOutcome({
    rootDir, batch, pairedTrustPolicy, evaluatedAt, resolveRevision, validateCandidate,
  }).report;
  if (enabledFlag(env.CI) || enabledFlag(env.GITHUB_ACTIONS)) {
    throw new Error('CI/GitHub Actions 中禁止 paired outcome --write');
  }
  const authorizationPreview = prepareEvolutionPairedOutcome({
    rootDir, batch, pairedTrustPolicy, evaluatedAt, resolveRevision, validateCandidate,
  });
  if (authorizationPreview.report.counts.candidates === 0) return {
    ...authorizationPreview.report,
    mode: 'write',
    recovery: { status: 'not-attempted-without-protected-authorization' },
    ledgerMutationRequested: true,
    ledgerMutationPerformed: false,
  };
  const realRoot = fs.realpathSync(rootDir);
  const lock = transactionApi.acquire({ rootDir: realRoot });
  try {
    const recovery = transactionApi.recover({
      rootDir: realRoot, controlPaths: lock,
      receiptsPath: path.join(realRoot, RECEIPTS_RELATIVE_PATH),
      outcomesPath: path.join(realRoot, OUTCOMES_RELATIVE_PATH), resolveRevision,
    });
    const recoveryMutationPerformed = getEvolutionOutcomeRecoveryMutationPerformed(recovery);
    const prepared = prepareEvolutionPairedOutcome({
      rootDir: realRoot, batch, pairedTrustPolicy, evaluatedAt, resolveRevision, validateCandidate,
    });
    if (prepared.report.counts.candidates === 0) return {
      ...prepared.report, mode: 'write', recovery,
      ledgerMutationRequested: true, ledgerMutationPerformed: recoveryMutationPerformed,
    };
    const transaction = prepared.transaction;
    const result = transactionApi.commit({
      rootDir: realRoot, controlPaths: lock, revision: transaction.revision,
      receiptsPath: transaction.receiptsPath, outcomesPath: transaction.outcomesPath,
      receiptsBase: transaction.receiptsBase, outcomesBase: transaction.outcomesBase,
      receiptSuffix: transaction.receiptSuffix, outcomeSuffix: transaction.outcomeSuffix,
      resolveRevision,
      postcheck: buildPostcheck({
        rootDir: realRoot, evaluatedAt, resolveRevision, pairedTrustPolicy, transaction,
      }),
    });
    return {
      ...prepared.report, mode: 'write', status: result.status, recovery, transaction: result,
      ledgerMutationRequested: true, ledgerMutationPerformed: true,
    };
  } finally {
    lock.release();
  }
};
