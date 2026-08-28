import path from 'node:path';

import { getLatestGlobalIsoDate } from './aiGovernanceDateBounds.mjs';
import { collectEvolutionOutcomeFailures } from './aiGovernanceEvolutionOutcomeContract.mjs';
import { buildEvolutionOutcomeChainReport } from './aiGovernanceEvolutionOutcomeChain.mjs';
import { readEvolutionJsonlSource } from './aiGovernanceEvolutionJsonlSource.mjs';

export const AI_EVOLUTION_OUTCOME_LEDGER_MAX_BYTES = 8 * 1024 * 1024;
export const AI_EVOLUTION_OUTCOME_MAX_LINE_BYTES = 64 * 1024;
export const AI_EVOLUTION_OUTCOME_MAX_PHYSICAL_LINES = 8192;
export const AI_EVOLUTION_OUTCOME_MAX_RECORDS = 4096;

const emptyChain = () => buildEvolutionOutcomeChainReport([]).summary;

const failedLedger = (failure, ledgerChain = emptyChain()) => ({
  outcomes: [],
  validOutcomes: [],
  failures: [failure],
  invalidOutcomeCount: 0,
  ledgerChain: { ...ledgerChain, status: 'fail' },
});

const parseOutcomeLines = (lines) => {
  const outcomes = [];
  const entries = [];
  const failures = [];
  lines.forEach(({ line, lineNumber, ordinal }) => {
    try {
      const outcome = JSON.parse(line);
      let canonical;
      try { canonical = JSON.stringify(outcome); }
      catch {
        entries.push({ outcome: null, line, ordinal });
        failures.push(`outcomes.jsonl: 第 ${lineNumber} 行结构超过支持范围`);
        return;
      }
      outcomes.push(outcome);
      entries.push({ outcome, line, ordinal });
      if (line !== canonical) failures.push(`outcomes.jsonl: 第 ${lineNumber} 行必须使用精确紧凑 JSON`);
    } catch {
      entries.push({ outcome: null, line, ordinal });
      failures.push(`outcomes.jsonl: 第 ${lineNumber} 行不是合法 JSON`);
    }
  });
  return { outcomes, entries, failures };
};

export const readEvolutionOutcomeLedger = (
  filePath,
  {
    caseIds = new Set(),
    maxDate = getLatestGlobalIsoDate(),
    rootDir = path.resolve(path.dirname(filePath), '../..'),
    receiptsById = new Map(),
    currentCorpusVersion,
  } = {},
) => {
  const source = readEvolutionJsonlSource(filePath, {
    label: 'outcomes.jsonl',
    maxBytes: AI_EVOLUTION_OUTCOME_LEDGER_MAX_BYTES,
    maxLineBytes: AI_EVOLUTION_OUTCOME_MAX_LINE_BYTES,
    maxPhysicalLines: AI_EVOLUTION_OUTCOME_MAX_PHYSICAL_LINES,
    maxRecords: AI_EVOLUTION_OUTCOME_MAX_RECORDS,
  });
  if (source.failure) return failedLedger(source.failure);

  const parsed = parseOutcomeLines(source.lines);
  const chainReport = buildEvolutionOutcomeChainReport(parsed.entries);
  const structuralFailures = [...parsed.failures, ...chainReport.failures];
  const failures = [...structuralFailures];
  const locallyValidOutcomes = [];
  let latestEvaluatedAt = '';
  parsed.entries.filter(entry => entry.outcome !== null).forEach(({ outcome, ordinal }) => {
    const itemFailures = collectEvolutionOutcomeFailures(outcome, ordinal, {
      caseIds, maxDate, rootDir, receiptsById, currentCorpusVersion,
    });
    if (typeof outcome?.evaluatedAt === 'string' && latestEvaluatedAt && outcome.evaluatedAt < latestEvaluatedAt) {
      itemFailures.push(`outcomes.jsonl: 第 ${ordinal} 条 outcome.evaluatedAt 不能早于前序记录`);
    }
    if (typeof outcome?.evaluatedAt === 'string' && outcome.evaluatedAt > latestEvaluatedAt) {
      latestEvaluatedAt = outcome.evaluatedAt;
    }
    failures.push(...itemFailures);
    if (itemFailures.length === 0) locallyValidOutcomes.push(outcome);
  });
  const idCounts = new Map();
  parsed.outcomes.map(item => item?.id).filter(id => typeof id === 'string' && id)
    .forEach(id => idCounts.set(id, (idCounts.get(id) ?? 0) + 1));
  const duplicateIds = [...idCounts.values()].some(count => count > 1);
  if (duplicateIds) failures.push('outcomes.jsonl: outcome id 必须唯一');
  const globallyInvalid = structuralFailures.length > 0 || duplicateIds;
  const validOutcomes = globallyInvalid
    ? [] : locallyValidOutcomes.filter(outcome => idCounts.get(outcome.id) === 1);
  return {
    outcomes: parsed.outcomes,
    validOutcomes,
    failures,
    invalidOutcomeCount: parsed.entries.length - validOutcomes.length,
    ledgerChain: structuralFailures.length > 0
      ? { ...chainReport.summary, status: 'fail' } : chainReport.summary,
  };
};
