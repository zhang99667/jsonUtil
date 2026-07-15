#!/usr/bin/env node
// 项目级 validation plan component executor；默认只做零执行预检。

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runAiGovernanceValidationExecution } from './aiGovernanceValidationExecution.mjs';

const USAGE = `Usage:
  node scripts/ci/run-ai-validation-execution.mjs [--run] [--json]

默认只生成零执行 preflight；只有显式 --run 才会启动固定注册表命令。`;
const ARGUMENT_ERROR = 'AI_VALIDATION_EXECUTION_ARGUMENTS_INVALID';
const PROFILE = 'jsonutils-validation-execution-v1';
const SHA256 = /^[0-9a-f]{64}$/;
const ROOT_KEYS = [
  'blockers', 'claims', 'commands', 'cycle', 'evidenceScope', 'execution', 'integrity',
  'ok', 'outcomeEligible', 'plan', 'profile', 'reportType', 'schemaVersion', 'source', 'status',
].sort().join('\0');
const COMMAND_KEYS = [
  'descriptorSha256', 'executableSha256', 'exitCode', 'failureCode', 'id', 'ordinal', 'signal', 'status',
].sort().join('\0');
const FAILURE_CODES = new Set([
  null, 'launch-error', 'signal-or-timeout', 'nonzero-exit', 'runtime-unavailable',
  'state-drift', 'pre-command-state-unavailable', 'execution-boundary-failed',
]);
const CLAIM_KEYS = [
  'launcherShellUsed', 'nestedShellAbsenceVerified', 'commandOutputCaptured',
  'parentCredentialIsolationVerified', 'hostFilesystemIsolationVerified',
  'ledgerWriteAbsenceVerified', 'ignoredWorkspaceMutationAbsenceVerified', 'behaviorValidated',
];
const INTEGRITY_KEYS = [
  'rootIdentityStable', 'sourceRevisionStable', 'changedSetStable', 'validationPlanStable',
  'commandRegistryStable', 'ledgerEndpointsStable', 'executableBindingsStable',
  'runtimeBoundaryStable', 'runtimeCleanupSucceeded',
];
const SOURCE_KEYS = [
  'revision', 'rootIdentitySha256', 'changedSetStateSha256', 'changedSetSha256', 'planSha256',
  'commandSetSha256', 'ledgerEndpointsSha256', 'executableSetSha256',
];
const PLAN_KEYS = [
  'authorityProfile', 'changedFileCount', 'commandCount', 'manualCheckCount',
  'unclassifiedFileCount', 'commandMatchScope',
];
const ATTEMPTED_STATUSES = new Set(['launch-error', 'signaled', 'exited-zero', 'exited-nonzero']);
const fixedFailure = requested => ({
  schemaVersion: 1,
  reportType: 'ai-governance-validation-execution',
  profile: PROFILE,
  status: 'failed',
  ok: false,
  evidenceScope: 'component-only',
  outcomeEligible: false,
  source: null,
  plan: null,
  blockers: [{ code: 'VALIDATION_EXECUTION_FAILED', count: 1 }],
  cycle: { caseRunnerIntegration: 'deferred', recursiveExecution: false },
  commands: [],
  execution: { requested, launchAttemptCount: 0, descendantProcessQuiescenceVerified: false },
  integrity: null,
  claims: {
    launcherShellUsed: false,
    nestedShellAbsenceVerified: false,
    commandOutputCaptured: false,
    parentCredentialIsolationVerified: false,
    hostFilesystemIsolationVerified: false,
    ledgerWriteAbsenceVerified: false,
    ignoredWorkspaceMutationAbsenceVerified: false,
    behaviorValidated: false,
  },
});

const hasExactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype
  && Object.keys(value).sort().join('\0') === [...keys].sort().join('\0');
const isDigest = value => value === null || SHA256.test(value ?? '');
const hasClosedCommandResult = item => (
  (item.status === 'not-run' && item.exitCode === null && item.signal === null && item.failureCode === null)
  || (item.status === 'skipped' && item.exitCode === null && item.signal === null && item.failureCode !== null)
  || (item.status === 'launch-error' && item.exitCode === null && item.signal === null && item.failureCode === 'launch-error')
  || (item.status === 'signaled' && item.exitCode === null && item.signal !== null && item.failureCode === 'signal-or-timeout')
  || (item.status === 'exited-zero' && item.exitCode === 0 && item.signal === null && item.failureCode === null)
  || (item.status === 'exited-nonzero' && item.exitCode !== null && item.exitCode !== 0
    && item.signal === null && item.failureCode === 'nonzero-exit')
);
const isClosedReport = (report, requested) => {
  if (!hasExactKeys(report, ROOT_KEYS.split('\0')) || report.schemaVersion !== 1
    || report.reportType !== 'ai-governance-validation-execution' || report.profile !== PROFILE
    || !['ready', 'blocked', 'failed', 'completed-component'].includes(report.status)
    || report.ok !== ['ready', 'completed-component'].includes(report.status)
    || report.evidenceScope !== 'component-only' || report.outcomeEligible !== false
    || !Array.isArray(report.blockers) || !Array.isArray(report.commands)
    || report.blockers.some(item => !hasExactKeys(item, ['code', 'count'])
      || !/^[A-Z0-9_]+$/.test(item.code) || !Number.isSafeInteger(item.count) || item.count < 1)
    || report.commands.some(item => !hasExactKeys(item, COMMAND_KEYS.split('\0'))
      || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(item.id ?? '')
      || !Number.isSafeInteger(item.ordinal) || item.ordinal < 1
      || !SHA256.test(item.descriptorSha256 ?? '') || !isDigest(item.executableSha256)
      || !['not-run', 'skipped', 'launch-error', 'signaled', 'exited-zero', 'exited-nonzero'].includes(item.status)
      || !(item.exitCode === null || Number.isSafeInteger(item.exitCode))
      || !(item.signal === null || /^[A-Z0-9]+$/.test(item.signal)) || !FAILURE_CODES.has(item.failureCode)
      || !hasClosedCommandResult(item))) {
    return false;
  }
  if (report.commands.some((item, index) => item.ordinal !== index + 1)
    || new Set(report.blockers.map(item => item.code)).size !== report.blockers.length
    || !hasExactKeys(report.execution, ['requested', 'launchAttemptCount', 'descendantProcessQuiescenceVerified'])
    || report.execution.requested !== requested || !Number.isSafeInteger(report.execution.launchAttemptCount)
    || report.execution.launchAttemptCount < 0 || report.execution.descendantProcessQuiescenceVerified !== false
    || !hasExactKeys(report.cycle, ['caseRunnerIntegration', 'recursiveExecution'])
    || report.cycle.caseRunnerIntegration !== 'deferred' || report.cycle.recursiveExecution !== false
    || !hasExactKeys(report.claims, CLAIM_KEYS) || Object.values(report.claims).some(value => value !== false)
    || !(report.integrity === null || (hasExactKeys(report.integrity, INTEGRITY_KEYS)
      && Object.values(report.integrity).every(value => value === true || value === false || value === null)))) return false;
  const attempted = report.commands.filter(item => ATTEMPTED_STATUSES.has(item.status)).length;
  if (attempted !== report.execution.launchAttemptCount) return false;
  if (report.source === null) return report.status === 'failed' && !report.ok && report.plan === null
    && report.integrity === null && report.commands.length === 0 && report.blockers.length === 1
    && report.execution.launchAttemptCount === 0;
  const sourceValid = hasExactKeys(report.source, SOURCE_KEYS)
    && /^worktree-[0-9a-f]{64}$/.test(report.source.revision ?? '')
    && ['rootIdentitySha256', 'changedSetSha256', 'planSha256', 'commandSetSha256', 'ledgerEndpointsSha256']
      .every(key => SHA256.test(report.source[key] ?? ''))
    && isDigest(report.source.changedSetStateSha256) && isDigest(report.source.executableSetSha256);
  const planValid = hasExactKeys(report.plan, PLAN_KEYS)
    && report.plan.authorityProfile === 'raw-head-index-worktree-v1'
    && ['changedFileCount', 'commandCount', 'manualCheckCount'].every(key => (
      Number.isSafeInteger(report.plan[key]) && report.plan[key] >= 0
    )) && (report.plan.unclassifiedFileCount === null
      || (Number.isSafeInteger(report.plan.unclassifiedFileCount) && report.plan.unclassifiedFileCount >= 0))
    && ['all', 'sample', null].includes(report.plan.commandMatchScope);
  if (!sourceValid || !planValid || report.plan.commandCount !== report.commands.length) return false;
  const hasExecutableSet = report.source.executableSetSha256 !== null;
  if (report.commands.some(item => (item.executableSha256 !== null) !== hasExecutableSet)) return false;
  if (!requested && (report.execution.launchAttemptCount !== 0 || hasExecutableSet
    || report.commands.some(item => item.status !== 'not-run'))) return false;
  if (report.status === 'ready') return !requested && report.blockers.length === 0;
  if (report.status === 'blocked') return report.blockers.length > 0 && report.execution.launchAttemptCount === 0
    && report.commands.every(item => item.status === 'not-run');
  if (report.status === 'completed-component') return requested && report.blockers.length === 0
    && report.commands.every(item => item.status === 'exited-zero');
  return report.status === 'failed' && report.blockers.length > 0;
};

export const parseAiValidationExecutionArgs = (args) => {
  const allowed = new Set(['--run', '--json', '--help']);
  if (args.some(arg => !allowed.has(arg)) || new Set(args).size !== args.length
    || (args.includes('--help') && args.length !== 1)) return null;
  return { execute: args.includes('--run'), json: args.includes('--json'), help: args.includes('--help') };
};

export const runAiValidationExecutionCli = async ({
  args = process.argv.slice(2),
  rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  stdout = process.stdout,
  stderr = process.stderr,
  run = runAiGovernanceValidationExecution,
} = {}) => {
  const parsed = parseAiValidationExecutionArgs(args);
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
    const candidate = await run({ rootDir, execute: parsed.execute });
    report = isClosedReport(candidate, parsed.execute) ? candidate : fixedFailure(parsed.execute);
  } catch {
    report = fixedFailure(parsed.execute);
  }
  stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : `AI validation execution: ${report.status}\n`);
  return report.ok ? 0 : 1;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAiValidationExecutionCli().then((exitCode) => { process.exitCode = exitCode; });
}
