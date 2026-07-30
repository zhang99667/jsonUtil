import fs from 'node:fs';
import path from 'node:path';

import { readStableEvolutionSnapshotFile } from './aiGovernanceEvolutionSnapshotPrimitives.mjs';

export const AI_EVOLUTION_TRIAL_RECEIPT_LEDGER_MAX_BYTES = 8 * 1024 * 1024;
export const AI_EVOLUTION_TRIAL_RECEIPT_MAX_PHYSICAL_LINES = 8192;
export const AI_EVOLUTION_TRIAL_RECEIPT_MAX_RECORDS = 4096;

const strictUtf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

const failedSource = failure => ({
  receipts: [], entries: [], failures: [failure], fatal: true,
});

const readSourceBytes = (filePath) => {
  try {
    const absolutePath = path.resolve(filePath);
    const canonicalParent = fs.realpathSync(path.dirname(absolutePath));
    return readStableEvolutionSnapshotFile(
      canonicalParent,
      path.basename(absolutePath),
      AI_EVOLUTION_TRIAL_RECEIPT_LEDGER_MAX_BYTES,
    ).bytes;
  } catch {
    return null;
  }
};

const frameSourceLines = (source, maxLineBytes) => {
  const lines = [];
  let lineNumber = 1;
  let ordinal = 0;
  let offset = 0;
  while (true) {
    if (lineNumber > AI_EVOLUTION_TRIAL_RECEIPT_MAX_PHYSICAL_LINES) {
      return {
        failure: `trial-receipts.jsonl: 物理行数不能超过 ${AI_EVOLUTION_TRIAL_RECEIPT_MAX_PHYSICAL_LINES}`,
      };
    }
    const newline = source.indexOf('\n', offset);
    const end = newline === -1 ? source.length : newline;
    const rawLine = source.slice(offset, end);
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (Buffer.byteLength(line, 'utf8') > maxLineBytes) {
      return { failure: `trial-receipts.jsonl: 第 ${lineNumber} 行超过 ${maxLineBytes / 1024} KiB` };
    }
    if (line.trim()) {
      ordinal += 1;
      if (ordinal > AI_EVOLUTION_TRIAL_RECEIPT_MAX_RECORDS) {
        return {
          failure: `trial-receipts.jsonl: 非空记录数不能超过 ${AI_EVOLUTION_TRIAL_RECEIPT_MAX_RECORDS}`,
        };
      }
      lines.push({ line, lineNumber, ordinal });
    }
    if (newline === -1) break;
    offset = newline + 1;
    lineNumber += 1;
  }
  return { lines };
};

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
  const bytes = readSourceBytes(filePath);
  if (bytes === null) return failedSource('trial-receipts.jsonl: 无法读取稳定的有界普通文件');
  let source;
  try { source = strictUtf8.decode(bytes); }
  catch { return failedSource('trial-receipts.jsonl: 必须是合法 UTF-8'); }
  const framed = frameSourceLines(source, maxLineBytes);
  return framed.failure ? failedSource(framed.failure) : parseSourceLines(framed.lines);
};
