// 单源维护 validation execution 的命令 receipt、闭字段报告与 CLI 校验。

const PROFILE = 'jsonutils-validation-execution-v1';
const REPORT_TYPE = 'ai-governance-validation-execution';
const SHA256 = /^[0-9a-f]{64}$/;
const COMMAND_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SAFE_SIGNAL = /^[A-Z0-9]+$/;
const BLOCKER_CODE = /^[A-Z0-9_]+$/;
const ROOT_KEYS = [
  'blockers', 'claims', 'commands', 'cycle', 'evidenceScope', 'execution', 'integrity',
  'ok', 'outcomeEligible', 'plan', 'profile', 'reportType', 'schemaVersion', 'source', 'status',
];
const COMMAND_KEYS = [
  'descriptorSha256', 'executableSha256', 'exitCode', 'failureCode', 'id', 'ordinal', 'signal', 'status',
];
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
const FAILURE_CODES = new Set([
  null, 'launch-error', 'signal-or-timeout', 'nonzero-exit', 'runtime-unavailable',
  'command-preparation-failed', 'state-drift', 'pre-command-state-unavailable',
  'execution-boundary-failed',
]);
const ATTEMPTED_STATUSES = new Set(['launch-error', 'signaled', 'exited-zero', 'exited-nonzero']);

const hasExactKeys = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype
  && Object.keys(value).sort().join('\0') === [...keys].sort().join('\0');
const isDigest = value => value === null || SHA256.test(value ?? '');
const claims = () => Object.fromEntries(CLAIM_KEYS.map(key => [key, false]));
const execution = (requested, launchAttemptCount) => ({
  requested,
  launchAttemptCount,
  descendantProcessQuiescenceVerified: false,
});

export const buildAiGovernanceValidationCommandReceipt = (item, ordinal, bindings, values = {}) => ({
  ordinal,
  id: item.id,
  descriptorSha256: item.descriptorSha256,
  executableSha256: bindings?.byExecutable?.[item.descriptor.executable]?.sha256 ?? null,
  status: values.status ?? 'not-run',
  exitCode: values.exitCode ?? null,
  signal: values.signal ?? null,
  failureCode: values.failureCode ?? null,
});

export const buildAiGovernanceValidationNotRunCommands = (commands, bindings) => commands
  .map((item, index) => buildAiGovernanceValidationCommandReceipt(item, index + 1, bindings));

export const buildAiGovernanceValidationSkippedCommands = (commands, start, bindings, failureCode) => commands
  .slice(start).map((item, offset) => buildAiGovernanceValidationCommandReceipt(
    item,
    start + offset + 1,
    bindings,
    { status: 'skipped', failureCode },
  ));

export const buildAiGovernanceValidationDirectResultReceipt = (
  item,
  ordinal,
  bindings,
  result,
) => {
  if (result?.error) return buildAiGovernanceValidationCommandReceipt(item, ordinal, bindings, {
    status: 'launch-error', failureCode: 'launch-error',
  });
  const signal = typeof result?.signal === 'string' && SAFE_SIGNAL.test(result.signal) ? result.signal : null;
  if (signal) return buildAiGovernanceValidationCommandReceipt(item, ordinal, bindings, {
    status: 'signaled', signal, failureCode: 'signal-or-timeout',
  });
  if (result?.status === 0) return buildAiGovernanceValidationCommandReceipt(
    item, ordinal, bindings, { status: 'exited-zero', exitCode: 0 },
  );
  if (Number.isSafeInteger(result?.status)) return buildAiGovernanceValidationCommandReceipt(item, ordinal, bindings, {
    status: 'exited-nonzero', exitCode: result.status, failureCode: 'nonzero-exit',
  });
  return buildAiGovernanceValidationCommandReceipt(item, ordinal, bindings, {
    status: 'launch-error', failureCode: 'launch-error',
  });
};

export const buildAiGovernanceValidationExecutionReport = ({
  before, rootBinding, bindings, status, requested, blockers, results, integrity, launchAttemptCount,
}) => ({
  schemaVersion: 1,
  reportType: REPORT_TYPE,
  profile: PROFILE,
  status,
  ok: status === 'ready' || status === 'completed-component',
  evidenceScope: 'component-only',
  outcomeEligible: false,
  source: {
    revision: before.revision,
    rootIdentitySha256: rootBinding.identitySha256,
    ...before.digests,
    executableSetSha256: bindings?.setSha256 ?? null,
  },
  plan: {
    authorityProfile: before.plan.authority.profile ?? null,
    changedFileCount: before.plan.changedFileCount,
    commandCount: before.commands.length,
    manualCheckCount: before.plan.manualChecks.length,
    unclassifiedFileCount: before.plan.unclassifiedFileCount ?? null,
    commandMatchScope: before.plan.coverage.commandMatchScope ?? null,
  },
  blockers,
  cycle: { caseRunnerIntegration: 'deferred', recursiveExecution: false },
  commands: results,
  execution: execution(requested, launchAttemptCount),
  integrity,
  claims: claims(),
});

export const buildAiGovernanceValidationExecutionFailureReport = ({
  requested,
  blockerCode = 'VALIDATION_EXECUTION_FAILED',
}) => ({
  schemaVersion: 1,
  reportType: REPORT_TYPE,
  profile: PROFILE,
  status: 'failed',
  ok: false,
  evidenceScope: 'component-only',
  outcomeEligible: false,
  source: null,
  plan: null,
  blockers: [{ code: blockerCode, count: 1 }],
  cycle: { caseRunnerIntegration: 'deferred', recursiveExecution: false },
  commands: [],
  execution: execution(requested, 0),
  integrity: null,
  claims: claims(),
});

const hasClosedCommandResult = item => (
  (item.status === 'not-run' && item.exitCode === null && item.signal === null && item.failureCode === null)
  || (item.status === 'skipped' && item.exitCode === null && item.signal === null && item.failureCode !== null)
  || (item.status === 'launch-error' && item.exitCode === null && item.signal === null && item.failureCode === 'launch-error')
  || (item.status === 'signaled' && item.exitCode === null && item.signal !== null && item.failureCode === 'signal-or-timeout')
  || (item.status === 'exited-zero' && item.exitCode === 0 && item.signal === null && item.failureCode === null)
  || (item.status === 'exited-nonzero' && item.exitCode !== null && item.exitCode !== 0
    && item.signal === null && item.failureCode === 'nonzero-exit')
);

export const isClosedAiGovernanceValidationExecutionReport = (report, requested) => {
  if (!hasExactKeys(report, ROOT_KEYS) || report.schemaVersion !== 1 || report.reportType !== REPORT_TYPE
    || report.profile !== PROFILE || !['ready', 'blocked', 'failed', 'completed-component'].includes(report.status)
    || report.ok !== ['ready', 'completed-component'].includes(report.status)
    || report.evidenceScope !== 'component-only' || report.outcomeEligible !== false
    || !Array.isArray(report.blockers) || !Array.isArray(report.commands)
    || report.blockers.some(item => !hasExactKeys(item, ['code', 'count']) || !BLOCKER_CODE.test(item.code)
      || !Number.isSafeInteger(item.count) || item.count < 1)
    || report.commands.some(item => !hasExactKeys(item, COMMAND_KEYS) || !COMMAND_ID.test(item.id ?? '')
      || !Number.isSafeInteger(item.ordinal) || item.ordinal < 1
      || !SHA256.test(item.descriptorSha256 ?? '') || !isDigest(item.executableSha256)
      || !['not-run', 'skipped', 'launch-error', 'signaled', 'exited-zero', 'exited-nonzero'].includes(item.status)
      || !(item.exitCode === null || Number.isSafeInteger(item.exitCode))
      || !(item.signal === null || SAFE_SIGNAL.test(item.signal)) || !FAILURE_CODES.has(item.failureCode)
      || !hasClosedCommandResult(item))) return false;
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
  if (report.source === null) return report.status === 'failed' && report.plan === null
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
    && report.commands.every(item => item.status === 'not-run' || item.status === 'skipped');
  if (report.status === 'completed-component') return requested && report.blockers.length === 0
    && report.commands.every(item => item.status === 'exited-zero');
  return report.status === 'failed' && report.blockers.length > 0;
};
