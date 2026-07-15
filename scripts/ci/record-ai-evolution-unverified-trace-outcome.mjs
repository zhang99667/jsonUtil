#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import { fileURLToPath } from 'node:url';

import {
  AI_EVOLUTION_UNVERIFIED_TRACE_OBSERVATION_MAX_BYTES,
  parseEvolutionUnverifiedTraceObservation,
} from './aiGovernanceEvolutionUnverifiedTraceObservationContract.mjs';
import { recordEvolutionUnverifiedTraceOutcome } from './aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.mjs';

const ARGUMENT_ERROR_CODE = 'UNVERIFIED_TRACE_OUTCOME_WRITER_ARGUMENTS_INVALID';
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
const USAGE = `Usage:
  node scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs [--write] [--json] < observation.json

stdin 必须是至多 64 KiB 的精确紧凑、闭字段、redacted observation。
默认仅 preview；只有本地维护者显式 --write 才追加 unverified receipt/outcome。
CI/GitHub Actions 中禁止 --write。`;

export class UnverifiedTraceOutcomeWriterUsageError extends Error {}

export const parseUnverifiedTraceOutcomeWriterArgs = (args) => {
  const result = { write: false, json: false, help: false };
  const seen = new Set();
  for (const arg of args) {
    if (!['--write', '--json', '--help'].includes(arg)) {
      throw new UnverifiedTraceOutcomeWriterUsageError(`未知参数: ${arg}`);
    }
    if (seen.has(arg)) throw new UnverifiedTraceOutcomeWriterUsageError(`参数不能重复: ${arg}`);
    seen.add(arg);
    if (arg === '--write') result.write = true;
    if (arg === '--json') result.json = true;
    if (arg === '--help') result.help = true;
  }
  if (result.help && args.length !== 1) throw new UnverifiedTraceOutcomeWriterUsageError('--help 不能与其它参数组合');
  return result;
};

export const readUnverifiedTraceObservationStdin = () => {
  const chunks = [];
  let total = 0;
  const buffer = Buffer.allocUnsafe(16 * 1024);
  while (true) {
    const bytes = fs.readSync(0, buffer, 0, buffer.length, null);
    if (bytes === 0) break;
    total += bytes;
    if (total > AI_EVOLUTION_UNVERIFIED_TRACE_OBSERVATION_MAX_BYTES) {
      throw new TypeError('trace observation stdin 超过 64 KiB 上限');
    }
    chunks.push(Buffer.from(buffer.subarray(0, bytes)));
  }
  try {
    return strictUtf8.decode(Buffer.concat(chunks, total));
  } catch {
    throw new TypeError('trace observation stdin 必须是合法 UTF-8');
  }
};

const renderHuman = report => [
  `unverified trace outcome ${report.mode}: ${report.status}`,
  `case: ${report.caseId}`,
  `evidence: ${report.evidenceStatus}`,
  `revision: ${report.revision}`,
  `candidate: ${report.candidate.outcomeId}`,
  `confirmed coverage eligible: ${report.confirmedCoverageEligible}`,
].join('\n');

export const runUnverifiedTraceOutcomeWriterCli = ({
  args = process.argv.slice(2),
  rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  stdout = process.stdout,
  stderr = process.stderr,
  env = process.env,
  readInput = readUnverifiedTraceObservationStdin,
  record = recordEvolutionUnverifiedTraceOutcome,
} = {}) => {
  let parsed;
  try {
    parsed = parseUnverifiedTraceOutcomeWriterArgs(args);
  } catch {
    stderr.write(`${USAGE}\nError: ${ARGUMENT_ERROR_CODE}\n`);
    return 2;
  }
  if (parsed.help) {
    stdout.write(`${USAGE}\n`);
    return 0;
  }
  try {
    const observation = parseEvolutionUnverifiedTraceObservation(readInput());
    const report = record({ rootDir, observation, write: parsed.write, env });
    stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : `${renderHuman(report)}\n`);
    return report.ok ? 0 : 1;
  } catch (error) {
    const payload = {
      schemaVersion: 1,
      reportType: 'ai-evolution-unverified-trace-outcome-writer',
      ok: false,
      mode: parsed.write ? 'write' : 'preview',
      error: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
    };
    (parsed.json ? stdout : stderr).write(parsed.json
      ? `${JSON.stringify(payload, null, 2)}\n`
      : `unverified trace outcome ${payload.mode} failed: ${payload.error}\n`);
    return 1;
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runUnverifiedTraceOutcomeWriterCli();
}
