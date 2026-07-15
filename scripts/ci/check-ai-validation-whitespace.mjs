#!/usr/bin/env node
// 项目级三视图原始字节空白检查入口。

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkAiGovernanceValidationWhitespace } from './aiGovernanceValidationWhitespace.mjs';

const USAGE = `Usage:
  node scripts/ci/check-ai-validation-whitespace.mjs [--json]

检查 HEAD↔index、index↔worktree 与 untracked 原始字节中新增的空白错误。`;
const ARGUMENT_ERROR = 'AI_VALIDATION_WHITESPACE_ARGUMENTS_INVALID';
const PROFILE = 'raw-head-index-worktree-whitespace-v1';
const REPORT_KEYS = [
  'blockers', 'changedSet', 'checks', 'claims', 'evidenceScope', 'ok', 'outcomeEligible',
  'profile', 'reportType', 'schemaVersion', 'status',
].sort().join('\0');
const failedReport = {
  schemaVersion: 1,
  reportType: 'ai-governance-validation-whitespace',
  ok: false,
  status: 'failed',
  evidenceScope: 'component-only',
  outcomeEligible: false,
  blockers: [{ code: 'WHITESPACE_CHECK_FAILED', count: 1 }],
};

const isClosedReport = report => Boolean(report)
  && report.schemaVersion === 1
  && report.reportType === 'ai-governance-validation-whitespace'
  && report.profile === PROFILE
  && typeof report.ok === 'boolean'
  && report.status === (report.ok ? 'passed' : 'failed')
  && report.evidenceScope === 'component-only'
  && report.outcomeEligible === false
  && Object.keys(report).sort().join('\0') === REPORT_KEYS;

export const parseAiValidationWhitespaceArgs = (args) => {
  const allowed = new Set(['--json', '--help']);
  if (args.some(arg => !allowed.has(arg)) || new Set(args).size !== args.length
    || (args.includes('--help') && args.length !== 1)) return null;
  return { json: args.includes('--json'), help: args.includes('--help') };
};

const renderHuman = report => `AI validation whitespace: ${report.status}`;

export const runAiValidationWhitespaceCli = async ({
  args = process.argv.slice(2),
  rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  stdout = process.stdout,
  stderr = process.stderr,
  check = checkAiGovernanceValidationWhitespace,
} = {}) => {
  const parsed = parseAiValidationWhitespaceArgs(args);
  if (!parsed) {
    stderr.write(`${USAGE}\nError: ${ARGUMENT_ERROR}\n`);
    return 2;
  }
  if (parsed.help) {
    stdout.write(`${USAGE}\n`);
    return 0;
  }
  let report;
  try {
    const candidate = await check({ rootDir });
    report = isClosedReport(candidate) ? candidate : failedReport;
  } catch {
    report = failedReport;
  }
  stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : `${renderHuman(report)}\n`);
  return report.ok ? 0 : 1;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAiValidationWhitespaceCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
