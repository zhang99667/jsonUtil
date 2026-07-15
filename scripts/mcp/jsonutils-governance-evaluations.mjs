import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEvolutionEvalCorpus } from '../ci/aiGovernanceEvolutionEvalContract.mjs';
import { buildAiGovernanceEvolutionSuiteReport } from '../ci/aiGovernanceEvolutionSuiteReport.mjs';
import { readEvolutionOutcomeLedger } from '../ci/aiGovernanceEvolutionOutcomeLedger.mjs';
import { readEvolutionTrialReceiptLedger } from '../ci/aiGovernanceEvolutionTrialReceipts.mjs';
import { buildRecentScoredOutcomeSummary } from './jsonutils-governance-evaluation-outcomes.mjs';
import {
  buildJsonutilsEvaluationSummaryProjection,
  normalizeJsonutilsEvaluationSummaryLimit,
} from './jsonutils-governance-evaluation-projection.mjs';

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const buildJsonutilsEvaluationSummary = ({ rootDir = defaultRootDir, limit = 10, graderCalibrationRootDir } = {}) => {
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
  const report = buildAiGovernanceEvolutionSuiteReport({ rootDir, casesPath, outcomesPath, receiptsPath, graderCalibrationRootDir });
  const scoredOutcomeIds = new Set(report.scoredOutcomeIds ?? []);
  const fixedReplayOutcomeIds = new Set(report.fixedReplayVerifiedOutcomeIds ?? []);
  const traceVerifiedOutcomeIds = new Set(report.traceVerifiedOutcomeIds ?? []);
  const boundedLimit = normalizeJsonutilsEvaluationSummaryLimit(limit);
  const outcomeSummary = buildRecentScoredOutcomeSummary({
    outcomes: report.ok ? ledger.validOutcomes : [],
    scoredOutcomeIds,
    fixedReplayOutcomeIds,
    traceVerifiedOutcomeIds,
    limit: boundedLimit,
  });

  return buildJsonutilsEvaluationSummaryProjection({ report, outcomeSummary, limit: boundedLimit });
};
