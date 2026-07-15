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
const CHECK_KEYS = ['affectedComparisons', 'binarySkipped', 'checked'];
const CLAIM_KEYS = [
  'applicableRawComparisonsCompleted', 'launcherShellUsed', 'repositoryFiltersExecuted',
  'repositoryAttributeDriversExecuted', 'commandOutputReported', 'behaviorValidated',
];
const SHA256 = /^[0-9a-f]{64}$/;
const failedReport = {
  schemaVersion: 1,
  reportType: 'ai-governance-validation-whitespace',
  ok: false,
  status: 'failed',
  evidenceScope: 'component-only',
  outcomeEligible: false,
  blockers: [{ code: 'WHITESPACE_CHECK_FAILED', count: 1 }],
};

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype;
const hasExactKeys = (value, keys) => isPlainObject(value)
  && Object.keys(value).sort().join('\0') === [...keys].sort().join('\0');
const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isClosedCheck = value => hasExactKeys(value, CHECK_KEYS)
  && CHECK_KEYS.every(key => isCount(value[key]))
  && value.affectedComparisons + value.binarySkipped <= value.checked;
const isClosedReport = report => {
  if (!hasExactKeys(report, REPORT_KEYS.split('\0')) || report.schemaVersion !== 1
    || report.reportType !== 'ai-governance-validation-whitespace' || report.profile !== PROFILE
    || typeof report.ok !== 'boolean' || report.status !== (report.ok ? 'passed' : 'failed')
    || report.evidenceScope !== 'component-only' || report.outcomeEligible !== false
    || !hasExactKeys(report.changedSet, ['stateSha256', 'changedFileCount'])
    || !(report.changedSet.stateSha256 === null || SHA256.test(report.changedSet.stateSha256))
    || !isCount(report.changedSet.changedFileCount)
    || !hasExactKeys(report.checks, ['staged', 'untracked', 'worktree'])
    || !Object.values(report.checks).every(isClosedCheck)
    || !Array.isArray(report.blockers) || report.blockers.some(item => !hasExactKeys(item, ['code', 'count'])
      || !/^[A-Z0-9_]+$/.test(item.code) || !Number.isSafeInteger(item.count) || item.count < 1)
    || new Set(report.blockers.map(item => item.code)).size !== report.blockers.length
    || !hasExactKeys(report.claims, CLAIM_KEYS)
    || typeof report.claims.applicableRawComparisonsCompleted !== 'boolean'
    || CLAIM_KEYS.slice(1).some(key => report.claims[key] !== false)) return false;
  const affected = Object.values(report.checks).reduce((total, item) => total + item.affectedComparisons, 0);
  if (report.ok) return report.blockers.length === 0 && affected === 0
    && report.claims.applicableRawComparisonsCompleted && report.changedSet.stateSha256 !== null;
  if (report.blockers.length === 0) return false;
  if (report.changedSet.stateSha256 === null) return report.changedSet.changedFileCount === 0
    && Object.values(report.checks).every(item => item.checked === 0)
    && report.claims.applicableRawComparisonsCompleted === false;
  return true;
};

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
