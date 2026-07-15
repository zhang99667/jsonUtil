#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { recordEvolutionDeterministicOutcomes } from './aiGovernanceEvolutionDeterministicOutcomeWriter.mjs';

const CASE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const ARGUMENT_ERROR_CODE = 'DETERMINISTIC_OUTCOME_WRITER_ARGUMENTS_INVALID';
const USAGE = `Usage:
  node scripts/ci/record-ai-evolution-deterministic-outcomes.mjs --case <id> [--case <id> ...] [--write] [--json]

默认仅 preview 并运行固定 runner；只有显式 --write 才会追加 receipt/outcome。
CI/GitHub Actions 中禁止 --write。`;

export class DeterministicOutcomeWriterUsageError extends Error {}

export const parseDeterministicOutcomeWriterArgs = (args) => {
  const result = { caseIds: [], write: false, json: false, help: false };
  const seenFlags = new Set();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--case') {
      const caseId = args[index + 1];
      if (!CASE_ID_PATTERN.test(caseId ?? '')) {
        throw new DeterministicOutcomeWriterUsageError('--case 必须后跟安全的 kebab-case id');
      }
      result.caseIds.push(caseId);
      index += 1;
      continue;
    }
    if (!['--write', '--json', '--help'].includes(arg)) {
      throw new DeterministicOutcomeWriterUsageError(`未知参数: ${arg}`);
    }
    if (seenFlags.has(arg)) throw new DeterministicOutcomeWriterUsageError(`参数不能重复: ${arg}`);
    seenFlags.add(arg);
    if (arg === '--write') result.write = true;
    if (arg === '--json') result.json = true;
    if (arg === '--help') result.help = true;
  }
  if (result.help && args.length !== 1) throw new DeterministicOutcomeWriterUsageError('--help 不能与其它参数组合');
  if (!result.help && result.caseIds.length === 0) {
    throw new DeterministicOutcomeWriterUsageError('至少提供一个 --case');
  }
  if (new Set(result.caseIds).size !== result.caseIds.length) {
    throw new DeterministicOutcomeWriterUsageError('--case 不能重复');
  }
  return result;
};

const renderHuman = report => [
  `deterministic outcome ${report.mode}: ${report.status}`,
  `revision: ${report.revision}`,
  `selected/candidates/current: ${report.counts.selected}/${report.counts.candidates}/${report.counts.alreadyCurrent}`,
  ...report.cases.map(item => `- ${item.caseId}: ${item.status}`),
].join('\n');

export const runDeterministicOutcomeWriterCli = ({
  args = process.argv.slice(2),
  rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  stdout = process.stdout,
  stderr = process.stderr,
  env = process.env,
  record = recordEvolutionDeterministicOutcomes,
} = {}) => {
  let parsed;
  try {
    parsed = parseDeterministicOutcomeWriterArgs(args);
  } catch {
    stderr.write(`${USAGE}\nError: ${ARGUMENT_ERROR_CODE}\n`);
    return 2;
  }
  if (parsed.help) {
    stdout.write(`${USAGE}\n`);
    return 0;
  }
  try {
    const report = record({
      rootDir,
      caseIds: parsed.caseIds,
      write: parsed.write,
      env,
    });
    stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : `${renderHuman(report)}\n`);
    return report.ok ? 0 : 1;
  } catch (error) {
    const payload = {
      schemaVersion: 1,
      reportType: 'ai-evolution-deterministic-outcome-writer',
      ok: false,
      mode: parsed.write ? 'write' : 'preview',
      error: error.message.slice(0, 1000),
    };
    (parsed.json ? stdout : stderr).write(parsed.json
      ? `${JSON.stringify(payload, null, 2)}\n`
      : `deterministic outcome ${payload.mode} failed: ${payload.error}\n`);
    return 1;
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runDeterministicOutcomeWriterCli();
}
