#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES,
  parseEvolutionPairedBatchArtifact,
} from './aiGovernanceEvolutionPairedReceiptV4.mjs';
import { recordEvolutionPairedOutcome } from './aiGovernanceEvolutionPairedOutcomeWriter.mjs';

const ARGUMENT_ERROR_CODE = 'PAIRED_OUTCOME_WRITER_ARGUMENTS_INVALID';
const USAGE = `Usage:
  node scripts/ci/record-ai-evolution-paired-outcome.mjs [--write] [--json] < paired-batch.json

stdin 必须是至多 512 KiB 的精确紧凑、闭字段、redacted paired batch。
默认只做 preview；CI/GitHub Actions 禁止 --write。
项目 CLI 不接受 trust key；--write 不是充分条件，缺少仓外受保护 trust context 时不会写 ledger。`;

export class PairedOutcomeWriterUsageError extends Error {}

export const parsePairedOutcomeWriterArgs = (args) => {
  const result = { write: false, json: false, help: false };
  const seen = new Set();
  for (const arg of args) {
    if (!['--write', '--json', '--help'].includes(arg)) {
      throw new PairedOutcomeWriterUsageError(`未知参数: ${arg}`);
    }
    if (seen.has(arg)) throw new PairedOutcomeWriterUsageError(`参数不能重复: ${arg}`);
    seen.add(arg);
    if (arg === '--write') result.write = true;
    if (arg === '--json') result.json = true;
    if (arg === '--help') result.help = true;
  }
  if (result.help && args.length !== 1) {
    throw new PairedOutcomeWriterUsageError('--help 不能与其它参数组合');
  }
  return result;
};

export const readPairedOutcomeBatchStdin = () => {
  const chunks = [];
  let total = 0;
  const buffer = Buffer.allocUnsafe(16 * 1024);
  while (true) {
    const bytes = fs.readSync(0, buffer, 0, buffer.length, null);
    if (bytes === 0) break;
    total += bytes;
    if (total > AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES) {
      throw new TypeError('paired batch stdin 超过 512 KiB 上限');
    }
    chunks.push(Buffer.from(buffer.subarray(0, bytes)));
  }
  return Buffer.concat(chunks, total).toString('utf8');
};

const renderHuman = report => [
  `paired outcome ${report.mode}: ${report.status}`,
  `experiment: ${report.experimentId}`,
  `proof: ${report.proofStatus}`,
  `infrastructure eligible: ${report.infrastructureEligible}`,
  `candidate: ${report.candidate?.outcomeId ?? 'none'}`,
  `confirmed coverage eligible: ${report.confirmedCoverageEligible}`,
  `ledger mutation performed: ${report.ledgerMutationPerformed}`,
].join('\n');

export const runPairedOutcomeWriterCli = ({
  args = process.argv.slice(2),
  rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  stdout = process.stdout,
  stderr = process.stderr,
  env = process.env,
  readInput = readPairedOutcomeBatchStdin,
  record = recordEvolutionPairedOutcome,
} = {}) => {
  let parsed;
  try {
    parsed = parsePairedOutcomeWriterArgs(args);
  } catch {
    stderr.write(`${USAGE}\nError: ${ARGUMENT_ERROR_CODE}\n`);
    return 2;
  }
  if (parsed.help) {
    stdout.write(`${USAGE}\n`);
    return 0;
  }
  try {
    const batch = parseEvolutionPairedBatchArtifact(readInput());
    const report = record({ rootDir, batch, write: parsed.write, env });
    stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : `${renderHuman(report)}\n`);
    return report.ok ? 0 : 1;
  } catch (error) {
    const payload = {
      schemaVersion: 1,
      reportType: 'ai-evolution-paired-outcome-writer',
      ok: false,
      mode: parsed.write ? 'write' : 'preview',
      error: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
    };
    (parsed.json ? stdout : stderr).write(parsed.json
      ? `${JSON.stringify(payload, null, 2)}\n`
      : `paired outcome ${payload.mode} failed: ${payload.error}\n`);
    return 1;
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runPairedOutcomeWriterCli();
}
