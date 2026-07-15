// 生成闭字段 validation execution receipt；任何启动前 blocker 都保持零执行。

import { createHash } from 'node:crypto';

import { buildJsonutilsValidationPlan } from '../mcp/jsonutils-governance-validation-plan.mjs';
import { snapshotCodexFixedMcpTrialLedgers } from './aiGovernanceCodexFixedMcpTrialLedger.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import { collectAuthoritativeValidationChangedSet } from './aiGovernanceValidationChangedSet.mjs';
import {
  hashJsonutilsValidationCommandDescriptor,
  resolveJsonutilsValidationCommandDisplays,
} from './aiGovernanceValidationCommandRegistry.mjs';
import {
  bindJsonutilsValidationExecutables,
  buildJsonutilsValidationCommandEnvironment,
  cleanupJsonutilsValidationRuntime,
  createJsonutilsValidationRuntime,
  resolveJsonutilsValidationRoot,
  spawnJsonutilsValidationCommand,
  validateJsonutilsValidationExecutableBindings,
  validateJsonutilsValidationRoot,
  validateJsonutilsValidationRuntime,
} from './aiGovernanceValidationRuntime.mjs';

const PROFILE = 'jsonutils-validation-execution-v1';
const HASH_DOMAIN = 'jsonutils-validation-execution-state-v1\0';
const SHA256 = /^[0-9a-f]{64}$/;
const REVISION = /^worktree-[0-9a-f]{64}$/;
const COMMAND_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SAFE_SIGNAL = /^[A-Z0-9]+$/;
const LEDGER_PATHS = ['evals/ai-governance/outcomes.jsonl', 'evals/ai-governance/trial-receipts.jsonl'];
const stableSort = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const isPlainObject = value => value !== null && typeof value === 'object'
  && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const failure = code => Object.assign(new Error(code), { code });
const hashValue = (label, value) => createHash('sha256')
  .update(HASH_DOMAIN, 'utf8').update(`${label}\0`, 'utf8')
  .update(JSON.stringify(value), 'utf8').digest('hex');

const mergeBlockers = (...groups) => {
  const counts = new Map();
  groups.flat().forEach(({ code, count = 1 }) => counts.set(code, Math.max(counts.get(code) ?? 0, count)));
  return [...counts].sort(([left], [right]) => stableSort(left, right))
    .map(([code, count]) => ({ code, count }));
};

const validateLedgerSnapshots = (snapshots) => {
  if (!Array.isArray(snapshots) || snapshots.length !== LEDGER_PATHS.length) throw failure('VALIDATION_LEDGER_SNAPSHOT_INVALID');
  const paths = [];
  for (const snapshot of snapshots) {
    if (!isPlainObject(snapshot) || typeof snapshot.path !== 'string' || !SHA256.test(snapshot.sha256 ?? '')
      || ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs'].some(key => !/^\d+$/.test(snapshot[key] ?? ''))) {
      throw failure('VALIDATION_LEDGER_SNAPSHOT_INVALID');
    }
    paths.push(snapshot.path);
  }
  if (JSON.stringify(paths.sort(stableSort)) !== JSON.stringify([...LEDGER_PATHS].sort(stableSort))) {
    throw failure('VALIDATION_LEDGER_SNAPSHOT_INVALID');
  }
};

const validateChangedSet = (changedSet) => {
  if (!isPlainObject(changedSet) || typeof changedSet.ok !== 'boolean'
    || !Number.isSafeInteger(changedSet.changedFileCount) || changedSet.changedFileCount < 0
    || !Array.isArray(changedSet.allFiles) || !Array.isArray(changedSet.issues)) {
    throw failure('VALIDATION_CHANGED_SET_INVALID');
  }
};

const validatePlan = (plan) => {
  if (!isPlainObject(plan) || typeof plan.ok !== 'boolean'
    || !Number.isSafeInteger(plan.changedFileCount) || plan.changedFileCount < 0
    || !Array.isArray(plan.commands) || plan.commands.length > 128
    || !Array.isArray(plan.manualChecks) || plan.manualChecks.length > 128
    || !isPlainObject(plan.coverage) || !isPlainObject(plan.authority)) throw failure('VALIDATION_PLAN_SHAPE_INVALID');
  if (plan.commands.some(item => !isPlainObject(item) || typeof item.command !== 'string'
      || item.command.length === 0 || item.command.length > 1024 || /[\0\r\n]/.test(item.command))
    || plan.manualChecks.some(item => !isPlainObject(item) || !COMMAND_ID.test(item.id ?? ''))) {
    throw failure('VALIDATION_PLAN_SHAPE_INVALID');
  }
};

const validateCommands = (commands) => {
  if (!Array.isArray(commands) || commands.length > 128) throw failure('VALIDATION_COMMAND_SET_INVALID');
  const seen = new Set();
  for (const item of commands) {
    let descriptorSha256;
    try { descriptorSha256 = hashJsonutilsValidationCommandDescriptor(item?.descriptor); }
    catch { throw failure('VALIDATION_COMMAND_SET_INVALID'); }
    if (!isPlainObject(item) || !COMMAND_ID.test(item.id ?? '') || seen.has(item.id)
      || !SHA256.test(item.descriptorSha256 ?? '') || item.descriptorSha256 !== descriptorSha256) {
      throw failure('VALIDATION_COMMAND_SET_INVALID');
    }
    seen.add(item.id);
  }
};

const validateRootBinding = (binding) => {
  if (!isPlainObject(binding) || typeof binding.realPath !== 'string'
    || !isPlainObject(binding.identity) || !SHA256.test(binding.identitySha256 ?? '')) {
    throw failure('VALIDATION_ROOT_BINDING_INVALID');
  }
};

const validateExecutableBindingShape = (bindings, commands) => {
  if (!isPlainObject(bindings) || !isPlainObject(bindings.byExecutable)
    || typeof bindings.safePath !== 'string' || /[\0\r\n]/.test(bindings.safePath)
    || !SHA256.test(bindings.setSha256 ?? '')) throw failure('VALIDATION_EXECUTABLE_BINDING_INVALID');
  const expected = [...new Set(commands.map(item => item.descriptor.executable))].sort(stableSort);
  const actual = Object.keys(bindings.byExecutable).sort(stableSort);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw failure('VALIDATION_EXECUTABLE_BINDING_INVALID');
  for (const logicalName of actual) {
    const binding = bindings.byExecutable[logicalName];
    if (!isPlainObject(binding) || binding.logicalName !== logicalName || typeof binding.realPath !== 'string'
      || !SHA256.test(binding.pathSha256 ?? '') || !SHA256.test(binding.sha256 ?? '')
      || !isPlainObject(binding.stat)) throw failure('VALIDATION_EXECUTABLE_BINDING_INVALID');
  }
};

const collectStateBlockers = ({ changedSet, plan, commands }) => {
  const blockers = [];
  if (!SHA256.test(changedSet.stateSha256 ?? '')) blockers.push({ code: 'RAW_CHANGED_SET_STATE_REQUIRED', count: 1 });
  if (!changedSet.ok) blockers.push({ code: 'AUTHORITATIVE_CHANGED_SET_INVALID', count: Math.max(1, changedSet.issues.length) });
  if (!plan.ok) blockers.push({ code: 'VALIDATION_PLAN_INVALID', count: 1 });
  if (plan.authority.profile !== 'raw-head-index-worktree-v1' || plan.authority.authoritative !== true) {
    blockers.push({ code: 'AUTHORITATIVE_CHANGED_SET_REQUIRED', count: 1 });
  }
  if (plan.coverage.commandMatchScope !== 'all' || plan.coverage.unclassifiedFilesScope !== 'all') {
    blockers.push({ code: 'COMPLETE_CHANGED_SET_COVERAGE_REQUIRED', count: 1 });
  }
  if (!Number.isSafeInteger(plan.unclassifiedFileCount)) blockers.push({ code: 'UNCLASSIFIED_COUNT_UNAVAILABLE', count: 1 });
  else if (plan.unclassifiedFileCount > 0) blockers.push({ code: 'UNCLASSIFIED_FILES', count: plan.unclassifiedFileCount });
  if (plan.manualChecks.length > 0) blockers.push({ code: 'MANUAL_CHECKS_REQUIRED', count: plan.manualChecks.length });
  if (commands.length !== plan.commands.length) blockers.push({ code: 'COMMAND_REGISTRY_INCOMPLETE', count: 1 });
  if (plan.changedFileCount > 0 && commands.length === 0) blockers.push({ code: 'VALIDATION_COMMAND_SET_EMPTY', count: 1 });
  return mergeBlockers(blockers);
};

const defaultBuildPlan = ({ rootDir, changedSet }) => buildJsonutilsValidationPlan({
  rootDir,
  maxFiles: 50,
  collectChangedSet: () => changedSet,
});

const captureValidationState = async ({
  rootBinding,
  validateRoot,
  collectChangedSet,
  buildPlan,
  resolveCommands,
  resolveRevision,
  snapshotLedgers,
}) => {
  validateRoot(rootBinding);
  const rootDir = rootBinding.realPath;
  const ledgers = await snapshotLedgers(rootDir);
  validateLedgerSnapshots(ledgers);
  const revision = await resolveRevision(rootDir);
  if (!REVISION.test(revision ?? '')) throw failure('VALIDATION_REVISION_INVALID');
  const changedSet = await collectChangedSet(rootDir);
  validateChangedSet(changedSet);
  const plan = await buildPlan({ rootDir, changedSet });
  validatePlan(plan);
  let commands = [], registryFailure = false;
  try {
    commands = await resolveCommands({ rootDir, displayCommands: plan.commands.map(item => item.command) });
    validateCommands(commands);
  } catch {
    registryFailure = true;
  }
  validateRoot(rootBinding);
  return {
    revision,
    changedSet,
    plan,
    commands,
    blockers: mergeBlockers(
      collectStateBlockers({ changedSet, plan, commands }),
      registryFailure ? [{ code: 'COMMAND_REGISTRY_INVALID', count: 1 }] : [],
    ),
    digests: {
      changedSetStateSha256: SHA256.test(changedSet.stateSha256 ?? '') ? changedSet.stateSha256 : null,
      changedSetSha256: hashValue('changed-set', changedSet),
      planSha256: hashValue('plan', plan),
      commandSetSha256: hashValue('commands', commands.map(item => ({ id: item.id, descriptorSha256: item.descriptorSha256 }))),
      ledgerEndpointsSha256: hashValue('ledgers', ledgers),
    },
  };
};

const compareStates = (before, after) => {
  const integrity = {
    sourceRevisionStable: before.revision === after.revision,
    changedSetStable: before.digests.changedSetStateSha256 === after.digests.changedSetStateSha256
      && before.digests.changedSetSha256 === after.digests.changedSetSha256,
    validationPlanStable: before.digests.planSha256 === after.digests.planSha256,
    commandRegistryStable: before.digests.commandSetSha256 === after.digests.commandSetSha256,
    ledgerEndpointsStable: before.digests.ledgerEndpointsSha256 === after.digests.ledgerEndpointsSha256,
  };
  const blockers = [];
  if (!integrity.sourceRevisionStable) blockers.push({ code: 'SOURCE_REVISION_DRIFT', count: 1 });
  if (!integrity.changedSetStable) blockers.push({ code: 'CHANGED_SET_DRIFT', count: 1 });
  if (!integrity.validationPlanStable) blockers.push({ code: 'VALIDATION_PLAN_DRIFT', count: 1 });
  if (!integrity.commandRegistryStable) blockers.push({ code: 'COMMAND_REGISTRY_DRIFT', count: 1 });
  if (!integrity.ledgerEndpointsStable) blockers.push({ code: 'LEDGER_ENDPOINT_DRIFT', count: 1 });
  return { integrity, blockers };
};

const mergeIntegrityValue = (current, observed) => (
  current === false || observed === false ? false
    : current === null || observed === null ? null : true
);
const mergeIntegrity = (current, observed) => Object.fromEntries(Object.entries(current).map(([key, value]) => (
  [key, Object.hasOwn(observed, key) ? mergeIntegrityValue(value, observed[key]) : value]
)));
const unknownSourceIntegrity = {
  rootIdentityStable: null,
  sourceRevisionStable: null,
  changedSetStable: null,
  validationPlanStable: null,
  commandRegistryStable: null,
  ledgerEndpointsStable: null,
};
const validateCommandBoundary = ({ rootBinding, runtime, bindings, validateRoot, validateRuntime, validateBindings }) => {
  try { validateRoot(rootBinding); } catch { return 'root'; }
  try { validateRuntime(runtime, rootBinding); } catch { return 'runtime'; }
  try { validateBindings(bindings, rootBinding); } catch { return 'executable'; }
  return null;
};

const commandReceipt = (item, ordinal, bindings, values = {}) => ({
  ordinal,
  id: item.id,
  descriptorSha256: item.descriptorSha256,
  executableSha256: bindings?.byExecutable?.[item.descriptor.executable]?.sha256 ?? null,
  status: values.status ?? 'not-run',
  exitCode: values.exitCode ?? null,
  signal: values.signal ?? null,
  failureCode: values.failureCode ?? null,
});

const notRunCommands = (commands, bindings) => commands.map((item, index) => commandReceipt(item, index + 1, bindings));
const skippedCommands = (commands, start, bindings, failureCode) => commands.slice(start)
  .map((item, offset) => commandReceipt(item, start + offset + 1, bindings, { status: 'skipped', failureCode }));

const directResultReceipt = (item, ordinal, bindings, result, launchAttempted) => {
  if (!launchAttempted || result?.error) return commandReceipt(item, ordinal, bindings, {
    status: 'launch-error', failureCode: 'launch-error',
  });
  const signal = typeof result.signal === 'string' && SAFE_SIGNAL.test(result.signal) ? result.signal : null;
  if (signal) return commandReceipt(item, ordinal, bindings, {
    status: 'signaled', signal, failureCode: 'signal-or-timeout',
  });
  if (result.status === 0) return commandReceipt(item, ordinal, bindings, { status: 'exited-zero', exitCode: 0 });
  if (Number.isSafeInteger(result.status)) return commandReceipt(item, ordinal, bindings, {
    status: 'exited-nonzero', exitCode: result.status, failureCode: 'nonzero-exit',
  });
  return commandReceipt(item, ordinal, bindings, { status: 'launch-error', failureCode: 'launch-error' });
};

const failedIntegrity = () => ({
  rootIdentityStable: false,
  sourceRevisionStable: false,
  changedSetStable: false,
  validationPlanStable: false,
  commandRegistryStable: false,
  ledgerEndpointsStable: false,
  executableBindingsStable: false,
  runtimeBoundaryStable: false,
  runtimeCleanupSucceeded: false,
});

const renderReport = ({
  before, rootBinding, bindings, status, execute, blockers, results, integrity, launchAttemptCount,
}) => ({
  schemaVersion: 1,
  reportType: 'ai-governance-validation-execution',
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
  execution: { requested: execute, launchAttemptCount, descendantProcessQuiescenceVerified: false },
  integrity,
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

const failedReport = execute => ({
  schemaVersion: 1,
  reportType: 'ai-governance-validation-execution',
  profile: PROFILE,
  status: 'failed',
  ok: false,
  evidenceScope: 'component-only',
  outcomeEligible: false,
  source: null,
  plan: null,
  blockers: [{ code: 'VALIDATION_PREFLIGHT_FAILED', count: 1 }],
  cycle: { caseRunnerIntegration: 'deferred', recursiveExecution: false },
  commands: [],
  execution: { requested: execute, launchAttemptCount: 0, descendantProcessQuiescenceVerified: false },
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

export const runAiGovernanceValidationExecution = async ({
  rootDir = process.cwd(),
  execute = false,
  ambientEnv = process.env,
  collectChangedSet = collectAuthoritativeValidationChangedSet,
  buildPlan = defaultBuildPlan,
  resolveCommands = resolveJsonutilsValidationCommandDisplays,
  resolveRevision = resolveEvolutionWorktreeRevision,
  snapshotLedgers = snapshotCodexFixedMcpTrialLedgers,
  resolveRoot = resolveJsonutilsValidationRoot,
  validateRoot = validateJsonutilsValidationRoot,
  bindExecutables = bindJsonutilsValidationExecutables,
  validateBindings = validateJsonutilsValidationExecutableBindings,
  createRuntime = createJsonutilsValidationRuntime,
  validateRuntime = validateJsonutilsValidationRuntime,
  cleanupRuntime = cleanupJsonutilsValidationRuntime,
  buildEnvironment = buildJsonutilsValidationCommandEnvironment,
  spawnCommand = spawnJsonutilsValidationCommand,
} = {}) => {
  let rootBinding, before;
  try {
    rootBinding = resolveRoot(rootDir);
    validateRootBinding(rootBinding);
    validateRoot(rootBinding);
    before = await captureValidationState({
      rootBinding, validateRoot, collectChangedSet, buildPlan, resolveCommands, resolveRevision, snapshotLedgers,
    });
  } catch {
    return failedReport(execute);
  }

  let blockers = before.blockers;
  let results = notRunCommands(before.commands);
  let launchAttemptCount = 0, bindings = null;
  let executionFailure = false, capabilityBlocked = false;
  let executableBindingsStable = null, runtimeBoundaryStable = null, runtimeCleanupSucceeded = null;
  let observedIntegrity = {
    rootIdentityStable: true,
    sourceRevisionStable: true,
    changedSetStable: true,
    validationPlanStable: true,
    commandRegistryStable: true,
    ledgerEndpointsStable: true,
  };

  if (execute && blockers.length === 0) {
    try {
      bindings = bindExecutables({ rootBinding, commands: before.commands, ambientEnv });
      validateExecutableBindingShape(bindings, before.commands);
      validateBindings(bindings, rootBinding);
      executableBindingsStable = true;
      results = [];
    } catch {
      blockers = mergeBlockers(blockers, [{ code: 'VALIDATION_EXECUTABLE_BINDING_FAILED', count: 1 }]);
      capabilityBlocked = true;
    }

    if (bindings) {
      for (let index = 0; index < before.commands.length; index += 1) {
        const item = before.commands[index];
        let runtime;
        try {
          runtime = createRuntime(rootBinding);
          validateRuntime(runtime, rootBinding);
          runtimeBoundaryStable = runtimeBoundaryStable !== false;
          runtimeCleanupSucceeded = runtimeCleanupSucceeded !== false;
        } catch {
          blockers = mergeBlockers(blockers, [{ code: 'VALIDATION_RUNTIME_CREATION_FAILED', count: 1 }]);
          results.push(...skippedCommands(before.commands, index, bindings, 'runtime-unavailable'));
          runtimeBoundaryStable = false;
          capabilityBlocked = launchAttemptCount === 0;
          executionFailure = launchAttemptCount > 0;
          break;
        }

        let launchAllowed = true;
        try {
          const boundaryFailure = validateCommandBoundary({
            rootBinding, runtime, bindings, validateRoot, validateRuntime, validateBindings,
          });
          if (boundaryFailure === 'root') observedIntegrity.rootIdentityStable = false;
          if (boundaryFailure === 'runtime') runtimeBoundaryStable = false;
          if (boundaryFailure === 'executable') executableBindingsStable = false;
          if (boundaryFailure) throw failure('VALIDATION_COMMAND_BOUNDARY_INVALID');
          const checkpoint = await captureValidationState({
            rootBinding, validateRoot, collectChangedSet, buildPlan, resolveCommands, resolveRevision, snapshotLedgers,
          });
          const comparison = compareStates(before, checkpoint);
          observedIntegrity = mergeIntegrity(observedIntegrity, comparison.integrity);
          if (comparison.blockers.length > 0) {
            blockers = mergeBlockers(blockers, comparison.blockers);
            results.push(...skippedCommands(before.commands, index, bindings, 'state-drift'));
            executionFailure = true;
            launchAllowed = false;
          }
        } catch {
          observedIntegrity = mergeIntegrity(observedIntegrity, unknownSourceIntegrity);
          blockers = mergeBlockers(blockers, [{ code: 'PRE_COMMAND_STATE_CAPTURE_FAILED', count: 1 }]);
          results.push(...skippedCommands(before.commands, index, bindings, 'pre-command-state-unavailable'));
          executionFailure = true;
          launchAllowed = false;
        }

        if (!launchAllowed) {
          const cleaned = (() => { try { return cleanupRuntime(runtime, rootBinding) === true; } catch { return false; } })();
          runtimeCleanupSucceeded &&= cleaned;
          if (!cleaned) blockers = mergeBlockers(blockers, [{ code: 'RUNTIME_CLEANUP_FAILED', count: 1 }]);
          if (!cleaned) runtimeBoundaryStable = false;
          break;
        }

        let rawResult, launchAttempted = false;
        try {
          const descriptor = item.descriptor;
          const env = buildEnvironment({ descriptor, runtime, safePath: bindings.safePath, ambientEnv });
          const binding = bindings.byExecutable[descriptor.executable];
          launchAttemptCount += 1;
          launchAttempted = true;
          rawResult = spawnCommand({ rootBinding, descriptor, binding, env });
        } catch {
          rawResult = { error: true, status: null, signal: null };
        }
        results.push(directResultReceipt(item, index + 1, bindings, rawResult, launchAttempted));

        let stopAfterCommand = false;
        try {
          const boundaryFailure = validateCommandBoundary({
            rootBinding, runtime, bindings, validateRoot, validateRuntime, validateBindings,
          });
          if (boundaryFailure === 'root') observedIntegrity.rootIdentityStable = false;
          if (boundaryFailure === 'runtime') runtimeBoundaryStable = false;
          if (boundaryFailure === 'executable') executableBindingsStable = false;
          if (boundaryFailure) throw failure('VALIDATION_COMMAND_BOUNDARY_INVALID');
          const checkpoint = await captureValidationState({
            rootBinding, validateRoot, collectChangedSet, buildPlan, resolveCommands, resolveRevision, snapshotLedgers,
          });
          const comparison = compareStates(before, checkpoint);
          observedIntegrity = mergeIntegrity(observedIntegrity, comparison.integrity);
          if (comparison.blockers.length > 0) {
            blockers = mergeBlockers(blockers, comparison.blockers);
            executionFailure = true;
            stopAfterCommand = true;
          }
        } catch {
          observedIntegrity = mergeIntegrity(observedIntegrity, unknownSourceIntegrity);
          blockers = mergeBlockers(blockers, [{ code: 'POST_COMMAND_STATE_CAPTURE_FAILED', count: 1 }]);
          executionFailure = true;
          stopAfterCommand = true;
        }

        const cleaned = (() => { try { return cleanupRuntime(runtime, rootBinding) === true; } catch { return false; } })();
        runtimeCleanupSucceeded &&= cleaned;
        if (!cleaned) {
          blockers = mergeBlockers(blockers, [{ code: 'RUNTIME_CLEANUP_FAILED', count: 1 }]);
          runtimeBoundaryStable = false;
          executionFailure = true;
          stopAfterCommand = true;
        }
        if (stopAfterCommand) {
          results.push(...skippedCommands(before.commands, index + 1, bindings, 'execution-boundary-failed'));
          break;
        }
      }
    }
  }

  let comparison, finalCaptureFailed = false;
  try {
    if (bindings) {
      validateBindings(bindings, rootBinding);
      executableBindingsStable = true;
    }
    const after = await captureValidationState({
      rootBinding, validateRoot, collectChangedSet, buildPlan, resolveCommands, resolveRevision, snapshotLedgers,
    });
    comparison = compareStates(before, after);
    observedIntegrity = mergeIntegrity(observedIntegrity, comparison.integrity);
    blockers = mergeBlockers(blockers, comparison.blockers);
    if (comparison.blockers.length > 0) executionFailure = true;
  } catch {
    finalCaptureFailed = true;
    executionFailure = true;
    executableBindingsStable = bindings ? false : null;
    blockers = mergeBlockers(blockers, [{ code: 'POST_EXECUTION_STATE_CAPTURE_FAILED', count: 1 }]);
  }

  const directFailures = results.filter(result => ['launch-error', 'signaled', 'exited-nonzero'].includes(result.status));
  if (directFailures.length > 0) {
    blockers = mergeBlockers(blockers, [{ code: 'VALIDATION_COMMAND_FAILED', count: directFailures.length }]);
    executionFailure = true;
  }
  if (bindings && executableBindingsStable === null) executableBindingsStable = false;
  const integrity = finalCaptureFailed ? failedIntegrity() : {
    ...observedIntegrity,
    executableBindingsStable,
    runtimeBoundaryStable,
    runtimeCleanupSucceeded,
  };
  const status = executionFailure ? 'failed'
    : blockers.length > 0 || capabilityBlocked ? 'blocked'
      : !execute ? 'ready' : 'completed-component';
  return renderReport({
    before, rootBinding, bindings, status, execute, blockers, results, integrity, launchAttemptCount,
  });
};

export const buildAiGovernanceValidationExecutionPreflight = options => runAiGovernanceValidationExecution({
  ...options,
  execute: false,
});
