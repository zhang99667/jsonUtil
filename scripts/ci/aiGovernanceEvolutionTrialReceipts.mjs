import { createHash } from 'node:crypto';

import { getLatestGlobalIsoDate } from './aiGovernanceDateBounds.mjs';
import {
  AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES,
} from './aiGovernanceEvolutionPairedReceiptV4BatchContract.mjs';
import { collectEvolutionTrialReceiptFailures } from './aiGovernanceEvolutionTrialReceiptContract.mjs';
import { readEvolutionTrialReceiptSource } from './aiGovernanceEvolutionTrialReceiptSource.mjs';
const MAX_LINE_BYTES = 64 * 1024;

export const hashEvolutionTrialReceiptLine = line => createHash('sha256').update(line, 'utf8').digest('hex');

export {
  aggregateEvolutionReceiptTrialResults,
  aggregateEvolutionTrialResults,
} from './aiGovernanceEvolutionTrialReceiptContract.mjs';

export const readEvolutionTrialReceiptLedger = (
  filePath,
  {
    rootDir, maxDate = getLatestGlobalIsoDate(), trustedSigners = new Map(), pairedTrustPolicy = {},
  } = {}
) => {
  const source = readEvolutionTrialReceiptSource(filePath, {
    maxLineBytes: AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES,
  });
  if (source.fatal) {
    return {
      receipts: [], validReceipts: [], receiptsById: new Map(),
      failures: source.failures, invalidReceiptCount: 0,
    };
  }
  const parsed = [];
  const failures = [...source.failures];
  source.entries.filter(entry => entry.receipt !== null).forEach(({
    receipt, line, lineNumber,
  }) => {
    const lineLimit = receipt?.schemaVersion === 4
      ? AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES : MAX_LINE_BYTES;
    const { failures: itemFailures, traceVerification, proofVerification, pairedVerification }
      = collectEvolutionTrialReceiptFailures(receipt, {
        index: lineNumber - 1,
        rootDir,
        maxDate,
        trustedSigners,
        pairedTrustPolicy,
      });
    if (Buffer.byteLength(line, 'utf8') > lineLimit) {
      itemFailures.push(`trial-receipts.jsonl: 第 ${lineNumber} 行超过 ${lineLimit / 1024} KiB`);
    }
    parsed.push({
      receipt, line, sha256: hashEvolutionTrialReceiptLine(line), failures: itemFailures,
      traceVerification, proofVerification, pairedVerification,
    });
    failures.push(...itemFailures);
  });
  const idCounts = new Map();
  parsed.forEach(({ receipt }) => idCounts.set(receipt.id, (idCounts.get(receipt.id) ?? 0) + 1));
  if ([...idCounts.values()].some(count => count > 1)) failures.push('trial-receipts.jsonl: receipt id 必须唯一');
  const replayFields = [
    ['assignment batchNonce', item => item.receipt.assignment?.batchNonce],
    ['semantic execution facts', item => JSON.stringify([
      item.receipt.experimentRef?.sha256, item.receipt.caseRef?.sha256,
      item.receipt.trialResults?.map(trial => [trial.trialId, trial.execution?.leaseKeySha256,
        trial.execution?.taskInstanceSha256, trial.resultSha256]),
    ])],
    ['assignment proof', item => item.receipt.proof?.assignmentEnvelope],
    ['checkpoint proof', item => item.receipt.proof?.checkpointEnvelope],
    ['batch proof', item => item.receipt.proof?.batchEnvelope],
  ];
  const replayed = new Set();
  for (const [label, select] of replayFields) {
    const groups = new Map();
    parsed.filter(item => item.receipt.schemaVersion === 4).forEach((item) => {
      const value = select(item);
      if (typeof value !== 'string' || value.length === 0) return;
      const entries = groups.get(value) ?? [];
      entries.push(item);
      groups.set(value, entries);
    });
    for (const entries of groups.values()) {
      if (entries.length < 2) continue;
      entries.forEach(item => replayed.add(item));
      failures.push(`trial-receipts.jsonl: paired v4 ${label} 不得跨 receipt 重放`);
    }
  }
  const structuralFailure = source.failures.length > 0;
  const validEntries = structuralFailure ? [] : parsed.filter(item => item.failures.length === 0
    && idCounts.get(item.receipt.id) === 1 && !replayed.has(item));
  const receiptsById = new Map(validEntries.map(item => [item.receipt.id, item]));
  return {
    receipts: parsed.map(item => item.receipt),
    validReceipts: validEntries.map(item => item.receipt),
    receiptsById,
    failures,
    invalidReceiptCount: source.entries.length - validEntries.length,
  };
};
