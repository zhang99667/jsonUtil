import { readEvolutionJsonlSource } from './aiGovernanceEvolutionJsonlSource.mjs';

export const AI_EVOLUTION_TRIAL_RECEIPT_LEDGER_MAX_BYTES = 8 * 1024 * 1024;
export const AI_EVOLUTION_TRIAL_RECEIPT_MAX_PHYSICAL_LINES = 8192;
export const AI_EVOLUTION_TRIAL_RECEIPT_MAX_RECORDS = 4096;

const failedSource = failure => ({
  receipts: [], entries: [], failures: [failure], fatal: true,
});

const parseSourceLines = (lines) => {
  const receipts = [];
  const entries = [];
  const failures = [];
  lines.forEach(({ line, lineNumber, ordinal }) => {
    try {
      const receipt = JSON.parse(line);
      let canonical;
      try { canonical = JSON.stringify(receipt); }
      catch {
        entries.push({ receipt: null, line, lineNumber, ordinal });
        failures.push(`trial-receipts.jsonl: 第 ${lineNumber} 行结构超过支持范围`);
        return;
      }
      receipts.push(receipt);
      entries.push({ receipt, line, lineNumber, ordinal });
      if (line !== canonical) {
        failures.push(`trial-receipts.jsonl: 第 ${lineNumber} 行必须使用精确紧凑 JSON`);
      }
    } catch {
      entries.push({ receipt: null, line, lineNumber, ordinal });
      failures.push(`trial-receipts.jsonl: 第 ${lineNumber} 行不是合法 JSON`);
    }
  });
  return { receipts, entries, failures, fatal: false };
};

export const readEvolutionTrialReceiptSource = (filePath, { maxLineBytes }) => {
  const source = readEvolutionJsonlSource(filePath, {
    label: 'trial-receipts.jsonl',
    maxBytes: AI_EVOLUTION_TRIAL_RECEIPT_LEDGER_MAX_BYTES,
    maxLineBytes,
    maxPhysicalLines: AI_EVOLUTION_TRIAL_RECEIPT_MAX_PHYSICAL_LINES,
    maxRecords: AI_EVOLUTION_TRIAL_RECEIPT_MAX_RECORDS,
  });
  return source.failure ? failedSource(source.failure) : parseSourceLines(source.lines);
};
