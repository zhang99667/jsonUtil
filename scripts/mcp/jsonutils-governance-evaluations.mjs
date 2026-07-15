import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEvolutionEvalCorpus } from '../ci/aiGovernanceEvolutionEvalContract.mjs';
import { buildAiGovernanceEvolutionSuiteReport } from '../ci/aiGovernanceEvolutionSuiteReport.mjs';
import { readEvolutionOutcomeLedger } from '../ci/aiGovernanceEvolutionOutcomeLedger.mjs';
import { readEvolutionTrialReceiptLedger } from '../ci/aiGovernanceEvolutionTrialReceipts.mjs';
import { buildRecentScoredOutcomeSummary } from './jsonutils-governance-evaluation-outcomes.mjs';

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const boundedLimit = value => Math.min(50, Math.max(1, Number.isInteger(value) ? value : 10));

export const buildJsonutilsEvaluationSummary = ({ rootDir = defaultRootDir, limit = 10 } = {}) => {
  const casesPath = path.join(rootDir, 'evals/ai-governance/cases.json');
  const outcomesPath = path.join(rootDir, 'evals/ai-governance/outcomes.jsonl');
  const receiptsPath = path.join(rootDir, 'evals/ai-governance/trial-receipts.jsonl');
  const corpus = readEvolutionEvalCorpus(casesPath);
  const caseIds = new Set([...corpus.cases.map(item => item.id), ...corpus.retiredCaseIds]);
  const receipts = readEvolutionTrialReceiptLedger(receiptsPath, { rootDir });
  const ledger = readEvolutionOutcomeLedger(outcomesPath, {
    caseIds,
    rootDir,
    receiptsById: receipts.receiptsById,
    currentCorpusVersion: corpus.corpus.corpusVersion,
  });
  const report = buildAiGovernanceEvolutionSuiteReport({ rootDir, casesPath, outcomesPath, receiptsPath });
  const scoredOutcomeIds = new Set(report.scoredOutcomeIds ?? []);
  const fixedReplayOutcomeIds = new Set(report.fixedReplayVerifiedOutcomeIds ?? []);
  const traceVerifiedOutcomeIds = new Set(report.traceVerifiedOutcomeIds ?? []);
  const outcomeSummary = buildRecentScoredOutcomeSummary({
    outcomes: report.ok ? ledger.validOutcomes : [],
    scoredOutcomeIds,
    fixedReplayOutcomeIds,
    traceVerifiedOutcomeIds,
    limit: boundedLimit(limit),
  });

  return {
    schemaVersion: 1,
    reportType: 'jsonutils-evaluation-summary',
    ok: report.ok,
    counts: report.counts,
    coverage: report.coverage,
    ledgerIntegrity: report.ledgerIntegrity,
    ledgerChain: report.ledgerChain,
    traceVerification: report.traceVerification,
    nextFocus: report.nextFocus,
    blockedFocus: report.blockedFocus,
    learning: {
      ...report.learning,
      openSignalIds: report.learning.openSignalIds.slice(0, boundedLimit(limit)),
      experiments: report.learning.experiments.slice(0, boundedLimit(limit)),
      truncated: report.learning.openSignalIds.length > boundedLimit(limit)
        || report.learning.experiments.length > boundedLimit(limit),
    },
    recentOutcomes: outcomeSummary.recentOutcomes,
    recentOutcomesScope: 'verified-v2-v3',
    truncated: outcomeSummary.truncated,
  };
};
