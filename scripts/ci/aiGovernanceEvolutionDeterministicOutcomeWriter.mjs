import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import {
  AI_EVOLUTION_EXECUTABLE_CASES,
  runAiGovernanceEvolutionCases,
} from './aiGovernanceEvolutionCaseRunner.mjs';
import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';
import {
  hashEvolutionOutcomeLegacyPrefix,
  hashEvolutionOutcomeV3Line,
} from './aiGovernanceEvolutionOutcomeChain.mjs';
import { readEvolutionOutcomeLedger } from './aiGovernanceEvolutionOutcomeLedger.mjs';
import {
  hashEvolutionTrialReceiptLine,
  readEvolutionTrialReceiptLedger,
} from './aiGovernanceEvolutionTrialReceipts.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import {
  acquireEvolutionOutcomeWriterLock,
  commitEvolutionOutcomeTransaction,
  readEvolutionOutcomeLedgerSnapshot,
  recoverEvolutionOutcomeTransaction,
} from './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';

export const AI_EVOLUTION_DETERMINISTIC_OUTCOME_WRITER_VERSION = '1.0.0';
const RUNNER_ID = 'ai-evolution-case-runner';
const OWNERSHIP_CASE_ID = 'rule-project-ai-asset-ownership';
const RECEIPTS_RELATIVE_PATH = 'evals/ai-governance/trial-receipts.jsonl';
const OUTCOMES_RELATIVE_PATH = 'evals/ai-governance/outcomes.jsonl';

const appendJsonLines = (base, lines) => {
  if (!Buffer.isBuffer(base)) throw new Error('ledger base 必须为 Buffer');
  if (lines.length === 0) return Buffer.alloc(0);
  const separator = base.length > 0 && base.at(-1) !== 0x0a ? '\n' : '';
  return Buffer.from(`${separator}${lines.join('\n')}\n`, 'utf8');
};

const lineageKey = value => JSON.stringify([value.caseId, value.caseVersion, value.subjectVersion]);

const latestLineageOutcomes = (outcomes) => {
  const latest = new Map();
  outcomes.forEach(outcome => latest.set(lineageKey(outcome), outcome));
  return latest;
};

const boundedEvidence = (parts, fallback) => {
  const value = parts.filter(Boolean).join('；').trim() || fallback;
  return value.slice(0, 1000);
};

const withPrivateLedgerCopies = ({ receiptsBytes, outcomesBytes }, callback) => {
  if (!Buffer.isBuffer(receiptsBytes) || !Buffer.isBuffer(outcomesBytes)) {
    throw new Error('ledger preview 必须使用已校验的 Buffer 快照');
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-outcome-writer-preview-'));
  fs.chmodSync(tempDir, 0o700);
  const receiptsPath = path.join(tempDir, 'trial-receipts.jsonl');
  const outcomesPath = path.join(tempDir, 'outcomes.jsonl');
  try {
    fs.writeFileSync(receiptsPath, receiptsBytes, { mode: 0o600, flag: 'wx' });
    fs.writeFileSync(outcomesPath, outcomesBytes, { mode: 0o600, flag: 'wx' });
    return callback({ receiptsPath, outcomesPath });
  } finally {
    for (const file of [receiptsPath, outcomesPath]) {
      try { fs.unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    fs.rmdirSync(tempDir);
  }
};

const assertDistinctLedgerSnapshots = (receipts, outcomes) => {
  if (receipts.endpoint.dev === outcomes.endpoint.dev && receipts.endpoint.ino === outcomes.endpoint.ino) {
    throw new Error('receipt/outcome ledger 不得指向同一 inode');
  }
};

const assertLedgerSnapshotUnchanged = (before, after, label) => {
  const endpointUnchanged = Object.keys(before.endpoint)
    .every(field => before.endpoint[field] === after.endpoint[field]);
  if (before.absolute !== after.absolute || !endpointUnchanged || !before.bytes.equals(after.bytes)) {
    throw new Error(`${label} 在 preview 期间发生漂移`);
  }
};

const currentPassIsReusable = ({ previous, revision, receiptsById }) => (
  previous?.schemaVersion === 3
  && previous.verdict === 'pass'
  && previous.provenance?.method === 'deterministic'
  && previous.provenance?.runner === RUNNER_ID
  && previous.provenance?.revision === revision
  && receiptsById.has(previous.evidence?.receiptId)
);

const collectSelectedCases = ({ corpus, caseIds }) => {
  if (!Array.isArray(caseIds) || caseIds.length === 0) throw new Error('至少选择一个 deterministic case');
  if (new Set(caseIds).size !== caseIds.length) throw new Error('case id 不能重复');
  const casesById = new Map(corpus.cases.map(item => [item.id, item]));
  return caseIds.map((caseId) => {
    const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[caseId];
    const corpusCase = casesById.get(caseId);
    if (!descriptor || !corpusCase) throw new Error(`不支持的 AI evolution case: ${caseId}`);
    if (caseId === OWNERSHIP_CASE_ID) {
      throw new Error('ownership case 需要当前 Git index/HEAD 分发证据，ledger writer 无法建立该前置，禁止直接入账');
    }
    if (corpusCase.coverageClass !== 'behavior' || descriptor.evidenceScope !== 'deterministic-case') {
      throw new Error(`case \`${caseId}\` 不是可入账的 behavior deterministic-case`);
    }
    if (corpusCase.caseVersion !== descriptor.caseVersion
      || corpusCase.subject?.version !== descriptor.subjectVersion) {
      throw new Error(`case \`${caseId}\` 的 corpus 与固定 runner 版本不一致`);
    }
    return { caseId, corpusCase, descriptor };
  });
};

const readValidatedLedgers = ({ rootDir, receiptsBytes, outcomesBytes, corpus, evaluatedAt }) => (
  withPrivateLedgerCopies({ receiptsBytes, outcomesBytes }, ({ receiptsPath, outcomesPath }) => {
    const receiptResult = readEvolutionTrialReceiptLedger(receiptsPath, {
      rootDir,
      maxDate: evaluatedAt,
    });
    if (receiptResult.failures.length > 0) {
      throw new Error(`receipt ledger 校验失败：${receiptResult.failures[0]}`);
    }
    const allowedCaseIds = new Set([
      ...corpus.cases.map(item => item.id),
      ...corpus.retiredCaseIds,
    ]);
    const outcomeResult = readEvolutionOutcomeLedger(outcomesPath, {
      caseIds: allowedCaseIds,
      maxDate: evaluatedAt,
      rootDir,
      receiptsById: receiptResult.receiptsById,
      currentCorpusVersion: corpus.corpus.corpusVersion,
    });
    if (outcomeResult.failures.length > 0) {
      throw new Error(`outcome ledger 校验失败：${outcomeResult.failures[0]}`);
    }
    return { receiptResult, outcomeResult };
  })
);

const validateRunnerReport = ({ report, pending }) => {
  if (!report?.ok || report.results?.length !== pending.length) {
    throw new Error(`固定 runner 失败：${report?.results?.find(item => item.status !== 'passed')?.diagnostic ?? '结果不完整'}`);
  }
  const resultsById = new Map(report.results.map(item => [item.caseId, item]));
  pending.forEach(({ caseId, descriptor }) => {
    const result = resultsById.get(caseId);
    if (!result || result.status !== 'passed' || result.outcomeEligible !== true
      || result.evidenceScope !== 'deterministic-case'
      || result.caseVersion !== descriptor.caseVersion
      || result.subjectVersion !== descriptor.subjectVersion
      || result.validations?.some(item => item.status !== 'passed')) {
      throw new Error(`固定 runner 没有产生可入账证据: ${caseId}`);
    }
  });
  return resultsById;
};

const createCandidateRecords = ({
  selected,
  resultsById,
  revision,
  evaluatedAt,
  corpusVersion,
  outcomesBase,
  outcomeResult,
  receiptResult,
}) => {
  const existingLines = outcomesBase.split(/\r?\n/).filter(line => line.trim());
  const previousByLineage = latestLineageOutcomes(outcomeResult.validOutcomes);
  const usedOutcomeIds = new Set(outcomeResult.outcomes.map(item => item.id));
  const usedReceiptIds = new Set(receiptResult.receipts.map(item => item.id));
  let previousV3Line = existingLines.length > 0 && outcomeResult.outcomes.at(-1)?.schemaVersion === 3
    ? existingLines.at(-1) : null;
  const legacyLines = previousV3Line === null ? existingLines : [];
  const receiptLines = [];
  const outcomeLines = [];
  const cases = [];

  selected.forEach(({ caseId, descriptor }, index) => {
    const result = resultsById.get(caseId);
    const sequence = outcomeResult.outcomes.length + index + 1;
    const suffix = `${evaluatedAt}-s${sequence}`;
    const receiptId = `receipt-${caseId}-deterministic-v${descriptor.caseVersion}-${suffix}`;
    const outcomeId = `${caseId}-deterministic-v${descriptor.caseVersion}-${suffix}`;
    if (usedReceiptIds.has(receiptId) || usedOutcomeIds.has(outcomeId)) {
      throw new Error(`deterministic writer id 冲突: ${caseId}`);
    }
    const validations = result.validations.map(item => ({
      command: item.command,
      status: 'passed',
      evidence: '固定 runner 退出码为 0，当前版本命令白名单验证通过',
      checkedAt: evaluatedAt,
    }));
    const receipt = {
      schemaVersion: 1,
      id: receiptId,
      artifactType: 'ai-evolution-trial-receipt',
      dataClass: 'redacted',
      caseId,
      corpusVersion,
      caseVersion: descriptor.caseVersion,
      subjectVersion: descriptor.subjectVersion,
      evaluatedAt,
      method: 'deterministic',
      source: 'local',
      runner: RUNNER_ID,
      revision,
      aggregation: 'all-pass',
      trialResults: [{
        trial: 1,
        verdict: 'pass',
        score: 100,
        gradeTarget: 'outcome',
        evidence: boundedEvidence(result.evidence ?? descriptor.evidence, '固定 deterministic case 实际执行通过'),
      }],
      validations,
    };
    const receiptLine = JSON.stringify(receipt);
    const previous = previousByLineage.get(lineageKey(receipt));
    const outcome = {
      schemaVersion: 3,
      id: outcomeId,
      caseId,
      corpusVersion,
      caseVersion: descriptor.caseVersion,
      subjectVersion: descriptor.subjectVersion,
      evaluatedAt,
      verdict: 'pass',
      score: 100,
      provenance: {
        method: 'deterministic',
        source: 'local',
        runner: RUNNER_ID,
        revision,
        trials: 1,
      },
      evidence: {
        receiptId,
        sha256: hashEvolutionTrialReceiptLine(receiptLine),
      },
      writeback: {
        files: [],
        validationResults: validations,
      },
      chain: {
        sequence,
        previousHash: previousV3Line === null
          ? hashEvolutionOutcomeLegacyPrefix(legacyLines)
          : hashEvolutionOutcomeV3Line(previousV3Line),
      },
      supersession: {
        previousOutcomeId: previous?.id ?? null,
        feedbackDisposition: previous && ['fail', 'partial'].includes(previous.verdict) ? 'resolved' : 'none',
        summary: previous
          ? '当前 source-state v2 重放通过，显式接续同 lineage 直接前序'
          : '当前 source-state v2 首次重放通过，保留既有账本历史',
      },
    };
    const outcomeLine = JSON.stringify(outcome);
    receiptLines.push(receiptLine);
    outcomeLines.push(outcomeLine);
    previousV3Line = outcomeLine;
    previousByLineage.set(lineageKey(outcome), outcome);
    usedReceiptIds.add(receiptId);
    usedOutcomeIds.add(outcomeId);
    cases.push({ caseId, status: 'candidate', receiptId, outcomeId, sequence });
  });
  return { receiptLines, outcomeLines, cases };
};

export const validateEvolutionDeterministicOutcomeCandidate = ({
  rootDir,
  receiptsBytes,
  outcomesBytes,
  evaluatedAt,
  revision,
}) => withPrivateLedgerCopies({ receiptsBytes, outcomesBytes }, ({ receiptsPath, outcomesPath }) => {
    const report = buildAiGovernanceEvolutionEvalReport({
      rootDir,
      receiptsPath,
      outcomesPath,
      maxDate: evaluatedAt,
      resolveRevision: () => revision,
    });
    if (!report.ok) throw new Error(`候选 ledger 全量校验失败：${report.failures[0]}`);
    return report;
  });

export const prepareEvolutionDeterministicOutcomeBatch = ({
  rootDir,
  caseIds,
  evaluatedAt = getLocalIsoDate(),
  runCases = runAiGovernanceEvolutionCases,
  resolveRevision = resolveEvolutionWorktreeRevision,
  validateCandidate = validateEvolutionDeterministicOutcomeCandidate,
} = {}) => {
  const realRoot = fs.realpathSync(rootDir);
  const receiptsPath = path.join(realRoot, RECEIPTS_RELATIVE_PATH);
  const outcomesPath = path.join(realRoot, OUTCOMES_RELATIVE_PATH);
  const corpus = readEvolutionEvalCorpus(path.join(realRoot, 'evals/ai-governance/cases.json'), { maxDate: evaluatedAt });
  if (corpus.failures.length > 0) throw new Error(`eval corpus 校验失败：${corpus.failures[0]}`);
  const selected = collectSelectedCases({ corpus, caseIds });
  const receiptsBefore = readEvolutionOutcomeLedgerSnapshot(realRoot, receiptsPath);
  const outcomesBefore = readEvolutionOutcomeLedgerSnapshot(realRoot, outcomesPath);
  assertDistinctLedgerSnapshots(receiptsBefore, outcomesBefore);
  const revisionBefore = resolveRevision(realRoot);
  const ledgers = readValidatedLedgers({
    rootDir: realRoot,
    receiptsBytes: receiptsBefore.bytes,
    outcomesBytes: outcomesBefore.bytes,
    corpus,
    evaluatedAt,
  });
  const previousByLineage = latestLineageOutcomes(ledgers.outcomeResult.validOutcomes);
  const noops = [];
  const pending = selected.filter(({ caseId, descriptor }) => {
    const previous = previousByLineage.get(JSON.stringify([caseId, descriptor.caseVersion, descriptor.subjectVersion]));
    if (!currentPassIsReusable({
      previous,
      revision: revisionBefore,
      receiptsById: ledgers.receiptResult.receiptsById,
    })) return true;
    noops.push({ caseId, status: 'already-current', outcomeId: previous.id });
    return false;
  });
  let resultsById = new Map();
  if (pending.length > 0) {
    const runnerReport = runCases({ rootDir: realRoot, caseIds: pending.map(item => item.caseId) });
    resultsById = validateRunnerReport({ report: runnerReport, pending });
  }
  const revisionAfter = resolveRevision(realRoot);
  if (revisionAfter !== revisionBefore) throw new Error('runner 执行期间 source-state v2 revision 发生漂移');
  const candidates = createCandidateRecords({
    selected: pending,
    resultsById,
    revision: revisionBefore,
    evaluatedAt,
    corpusVersion: corpus.corpus.corpusVersion,
    outcomesBase: outcomesBefore.bytes.toString('utf8'),
    outcomeResult: ledgers.outcomeResult,
    receiptResult: ledgers.receiptResult,
  });
  const receiptSuffix = appendJsonLines(receiptsBefore.bytes, candidates.receiptLines);
  const outcomeSuffix = appendJsonLines(outcomesBefore.bytes, candidates.outcomeLines);
  const candidateReport = validateCandidate({
    rootDir: realRoot,
    receiptsBytes: Buffer.concat([receiptsBefore.bytes, receiptSuffix]),
    outcomesBytes: Buffer.concat([outcomesBefore.bytes, outcomeSuffix]),
    evaluatedAt,
    revision: revisionBefore,
  });
  const revisionFinal = resolveRevision(realRoot);
  if (revisionFinal !== revisionBefore) throw new Error('candidate replay 期间 source-state v2 revision 发生漂移');
  const receiptsAfter = readEvolutionOutcomeLedgerSnapshot(realRoot, receiptsPath);
  const outcomesAfter = readEvolutionOutcomeLedgerSnapshot(realRoot, outcomesPath);
  assertDistinctLedgerSnapshots(receiptsAfter, outcomesAfter);
  assertLedgerSnapshotUnchanged(receiptsBefore, receiptsAfter, 'receipt ledger');
  assertLedgerSnapshotUnchanged(outcomesBefore, outcomesAfter, 'outcome ledger');
  return {
    report: {
      schemaVersion: 1,
      reportType: 'ai-evolution-deterministic-outcome-writer',
      writerVersion: AI_EVOLUTION_DETERMINISTIC_OUTCOME_WRITER_VERSION,
      ok: true,
      mode: 'preview',
      status: candidates.cases.length > 0 ? 'ready' : 'already-current',
      corpusVersion: corpus.corpus.corpusVersion,
      revision: revisionBefore,
      counts: {
        selected: selected.length,
        candidates: candidates.cases.length,
        alreadyCurrent: noops.length,
      },
      cases: [...noops, ...candidates.cases],
      ledgerIntegrity: candidateReport.ledgerIntegrity.status,
      ledgerMutationRequested: false,
    },
    transaction: {
      revision: revisionBefore,
      receiptsPath,
      outcomesPath,
      receiptsBase: receiptsBefore.bytes,
      outcomesBase: outcomesBefore.bytes,
      receiptSuffix,
      outcomeSuffix,
    },
  };
};

const isEnabledEnvironmentFlag = value => value !== undefined && value !== null
  && !['', '0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());

const buildPostcheck = ({ rootDir, evaluatedAt, revision, resolveRevision }) => () => {
  const currentRevision = resolveRevision(rootDir);
  if (currentRevision !== revision) return {
    ok: false,
    failures: ['ledger commit 后 source-state v2 revision 发生漂移'],
  };
  const report = buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: evaluatedAt });
  return { ok: report.ok, failures: report.failures };
};

export const recordEvolutionDeterministicOutcomes = ({
  rootDir,
  caseIds,
  write = false,
  evaluatedAt = getLocalIsoDate(),
  env = process.env,
  runCases = runAiGovernanceEvolutionCases,
  resolveRevision = resolveEvolutionWorktreeRevision,
  validateCandidate = validateEvolutionDeterministicOutcomeCandidate,
  transactionApi = {
    acquire: acquireEvolutionOutcomeWriterLock,
    recover: recoverEvolutionOutcomeTransaction,
    commit: commitEvolutionOutcomeTransaction,
  },
  transactionDependencies = {},
} = {}) => {
  if (typeof write !== 'boolean') throw new Error('write 必须是布尔值');
  if (!write) return prepareEvolutionDeterministicOutcomeBatch({
    rootDir, caseIds, evaluatedAt, runCases, resolveRevision, validateCandidate,
  }).report;
  if (isEnabledEnvironmentFlag(env.CI) || isEnabledEnvironmentFlag(env.GITHUB_ACTIONS)) {
    throw new Error('CI/GitHub Actions 中禁止 deterministic outcome --write');
  }
  const realRoot = fs.realpathSync(rootDir);
  const lock = transactionApi.acquire({ rootDir: realRoot, ...transactionDependencies.lock });
  try {
    const recovery = transactionApi.recover({
      rootDir: realRoot,
      controlPaths: lock,
      receiptsPath: path.join(realRoot, RECEIPTS_RELATIVE_PATH),
      outcomesPath: path.join(realRoot, OUTCOMES_RELATIVE_PATH),
      resolveRevision,
      ...transactionDependencies.recovery,
    });
    const prepared = prepareEvolutionDeterministicOutcomeBatch({
      rootDir: realRoot,
      caseIds,
      evaluatedAt,
      runCases,
      resolveRevision,
      validateCandidate,
    });
    if (prepared.report.counts.candidates === 0) return {
      ...prepared.report,
      mode: 'write',
      status: 'already-current',
      recovery,
      ledgerMutationRequested: true,
      ledgerMutationPerformed: false,
    };
    const transactionResult = transactionApi.commit({
      rootDir: realRoot,
      controlPaths: lock,
      ...prepared.transaction,
      resolveRevision,
      postcheck: buildPostcheck({
        rootDir: realRoot,
        evaluatedAt,
        revision: prepared.transaction.revision,
        resolveRevision,
      }),
      ...transactionDependencies.commit,
    });
    return {
      ...prepared.report,
      mode: 'write',
      status: transactionResult.status,
      recovery,
      transaction: transactionResult,
      ledgerMutationRequested: true,
      ledgerMutationPerformed: true,
    };
  } finally {
    lock.release();
  }
};
