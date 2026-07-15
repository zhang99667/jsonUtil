import fs from 'node:fs';
import path from 'node:path';

import { getLocalIsoDate } from './aiGovernanceDateBounds.mjs';
import { collectEvolutionOutcomeFailures } from './aiGovernanceEvolutionOutcomeContract.mjs';
import { buildEvolutionOutcomeChainReport } from './aiGovernanceEvolutionOutcomeChain.mjs';
import { readStableEvolutionSnapshotFile } from './aiGovernanceEvolutionSnapshotPrimitives.mjs';

export const AI_EVOLUTION_OUTCOME_LEDGER_MAX_BYTES = 8 * 1024 * 1024;
export const AI_EVOLUTION_OUTCOME_MAX_LINE_BYTES = 64 * 1024;
export const AI_EVOLUTION_OUTCOME_MAX_PHYSICAL_LINES = 8192;
export const AI_EVOLUTION_OUTCOME_MAX_RECORDS = 4096;

const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
const emptyChain = () => buildEvolutionOutcomeChainReport([]).summary;

const failedLedger = (failure, ledgerChain = emptyChain()) => ({
  outcomes: [],
  validOutcomes: [],
  failures: [failure],
  invalidOutcomeCount: 0,
  ledgerChain: { ...ledgerChain, status: 'fail' },
});

const readOutcomeLedgerSource = (filePath) => {
  let bytes;
  try {
    const absolutePath = path.resolve(filePath);
    const canonicalParent = fs.realpathSync(path.dirname(absolutePath));
    ({ bytes } = readStableEvolutionSnapshotFile(
      canonicalParent,
      path.basename(absolutePath),
      AI_EVOLUTION_OUTCOME_LEDGER_MAX_BYTES,
    ));
  } catch {
    return { source: '', failure: 'outcomes.jsonl: 无法读取稳定的有界普通文件' };
  }
  try { return { source: strictUtf8.decode(bytes) }; }
  catch { return { source: '', failure: 'outcomes.jsonl: 必须是合法 UTF-8' }; }
};

const frameOutcomeLines = (source) => {
  const lines = [];
  let lineNumber = 1;
  let ordinal = 0;
  let offset = 0;
  while (true) {
    if (lineNumber > AI_EVOLUTION_OUTCOME_MAX_PHYSICAL_LINES) {
      return { lines: [], failure: `outcomes.jsonl: 物理行数不能超过 ${AI_EVOLUTION_OUTCOME_MAX_PHYSICAL_LINES}` };
    }
    const newline = source.indexOf('\n', offset);
    const end = newline === -1 ? source.length : newline;
    const rawLine = source.slice(offset, end);
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (Buffer.byteLength(line, 'utf8') > AI_EVOLUTION_OUTCOME_MAX_LINE_BYTES) {
      return { lines: [], failure: `outcomes.jsonl: 第 ${lineNumber} 行超过 64 KiB` };
    }
    if (line.trim()) {
      ordinal += 1;
      if (ordinal > AI_EVOLUTION_OUTCOME_MAX_RECORDS) {
        return { lines: [], failure: `outcomes.jsonl: 非空记录数不能超过 ${AI_EVOLUTION_OUTCOME_MAX_RECORDS}` };
      }
      lines.push({ line, lineNumber, ordinal });
    }
    if (newline === -1) break;
    offset = newline + 1;
    lineNumber += 1;
  }
  return { lines };
};

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
    maxDate = getLocalIsoDate(),
    rootDir = path.resolve(path.dirname(filePath), '../..'),
    receiptsById = new Map(),
    currentCorpusVersion,
  } = {},
) => {
  const source = readOutcomeLedgerSource(filePath);
  if (source.failure) return failedLedger(source.failure);
  const framed = frameOutcomeLines(source.source);
  if (framed.failure) return failedLedger(framed.failure);

  const parsed = parseOutcomeLines(framed.lines);
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
