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
  validateJsonutilsValidationExecutableBindings,
} from './aiGovernanceValidationExecutables.mjs';
import {
  buildJsonutilsValidationCommandEnvironment,
  spawnJsonutilsValidationCommand,
} from './aiGovernanceValidationRuntime.mjs';
import {
  buildAiGovernanceValidationCommandReceipt,
  buildAiGovernanceValidationDirectResultReceipt,
  buildAiGovernanceValidationExecutionFailureReport,
  buildAiGovernanceValidationExecutionReport,
  buildAiGovernanceValidationNotRunCommands,
  buildAiGovernanceValidationSkippedCommands,
} from './aiGovernanceValidationExecutionReceipt.mjs';
import {
  cleanupJsonutilsValidationRuntime,
  createJsonutilsValidationRuntime,
  resolveJsonutilsValidationRoot,
  validateJsonutilsValidationRoot,
  validateJsonutilsValidationRuntime,
} from './aiGovernanceValidationWorkspaceRuntime.mjs';

const HASH_DOMAIN = 'jsonutils-validation-execution-state-v1\0';
const SHA256 = /^[0-9a-f]{64}$/;
const REVISION = /^worktree-[0-9a-f]{64}$/;
const COMMAND_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
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

const validateCommands = (commands, displayCommands) => {
  if (!Array.isArray(commands) || commands.length > 128 || commands.length !== displayCommands.length) {
    throw failure('VALIDATION_COMMAND_SET_INVALID');
  }
  const seen = new Set();
  for (let index = 0; index < commands.length; index += 1) {
    const item = commands[index];
    let descriptorSha256;
    try { descriptorSha256 = hashJsonutilsValidationCommandDescriptor(item?.descriptor); }
    catch { throw failure('VALIDATION_COMMAND_SET_INVALID'); }
    if (!isPlainObject(item) || !COMMAND_ID.test(item.id ?? '') || seen.has(item.id)
      || item.displayCommand !== displayCommands[index]
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
  if (plan.changedFileCount !== changedSet.changedFileCount
    || plan.coverage.totalChangedFileCount !== changedSet.changedFileCount
    || plan.authority.issueCount !== changedSet.issues.length) {
    blockers.push({ code: 'VALIDATION_PLAN_INVALID', count: 1 });
  }
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
  const ledgerSnapshots = await snapshotLedgers(rootDir);
  validateLedgerSnapshots(ledgerSnapshots);
  const ledgers = [...ledgerSnapshots].sort((left, right) => stableSort(left.path, right.path));
  const revision = await resolveRevision(rootDir);
  if (!REVISION.test(revision ?? '')) throw failure('VALIDATION_REVISION_INVALID');
  const changedSet = await collectChangedSet(rootDir);
  validateChangedSet(changedSet);
  const plan = await buildPlan({ rootDir, changedSet });
  validatePlan(plan);
  let commands = [], registryFailure = false;
  try {
    const displayCommands = plan.commands.map(item => item.command);
    commands = await resolveCommands({ rootDir, displayCommands });
    validateCommands(commands, displayCommands);
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
    return buildAiGovernanceValidationExecutionFailureReport({
      requested: execute,
      blockerCode: 'VALIDATION_PREFLIGHT_FAILED',
    });
  }

  let blockers = before.blockers;
  let results = buildAiGovernanceValidationNotRunCommands(before.commands);
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
      const candidate = bindExecutables({ rootBinding, commands: before.commands, ambientEnv });
      validateExecutableBindingShape(candidate, before.commands);
      validateBindings(candidate, rootBinding);
      bindings = candidate;
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
          if (runtime) {
            const cleaned = (() => { try { return cleanupRuntime(runtime, rootBinding) === true; } catch { return false; } })();
            runtimeCleanupSucceeded = cleaned;
            if (!cleaned) blockers = mergeBlockers(blockers, [{ code: 'RUNTIME_CLEANUP_FAILED', count: 1 }]);
          }
          results.push(...buildAiGovernanceValidationSkippedCommands(
            before.commands, index, bindings, 'runtime-unavailable',
          ));
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
            results.push(...buildAiGovernanceValidationSkippedCommands(before.commands, index, bindings, 'state-drift'));
            executionFailure = true;
            launchAllowed = false;
          }
        } catch {
          observedIntegrity = mergeIntegrity(observedIntegrity, unknownSourceIntegrity);
          blockers = mergeBlockers(blockers, [{ code: 'PRE_COMMAND_STATE_CAPTURE_FAILED', count: 1 }]);
          results.push(...buildAiGovernanceValidationSkippedCommands(
            before.commands, index, bindings, 'pre-command-state-unavailable',
          ));
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

        let rawResult, preparationFailed = false;
        try {
          const descriptor = item.descriptor;
          const env = buildEnvironment({ descriptor, runtime, safePath: bindings.safePath, ambientEnv });
          const binding = bindings.byExecutable[descriptor.executable];
          launchAttemptCount += 1;
          try { rawResult = spawnCommand({ rootBinding, descriptor, binding, env }); }
          catch { rawResult = { error: true, status: null, signal: null }; }
        } catch {
          preparationFailed = true;
          executionFailure = true;
          blockers = mergeBlockers(blockers, [{ code: 'VALIDATION_COMMAND_PREPARATION_FAILED', count: 1 }]);
          results.push(buildAiGovernanceValidationCommandReceipt(item, index + 1, bindings, {
            status: 'skipped', failureCode: 'command-preparation-failed',
          }));
        }
        if (!preparationFailed) {
          results.push(buildAiGovernanceValidationDirectResultReceipt(item, index + 1, bindings, rawResult));
        }

        let stopAfterCommand = preparationFailed;
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
          results.push(...buildAiGovernanceValidationSkippedCommands(
            before.commands, index + 1, bindings, 'execution-boundary-failed',
          ));
          break;
        }
      }
    }
  }

  let comparison, finalCaptureFailed = false;
  try {
    if (bindings) {
      validateBindings(bindings, rootBinding);
      executableBindingsStable = executableBindingsStable !== false;
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
  return buildAiGovernanceValidationExecutionReport({
    before, rootBinding, bindings, status, requested: execute, blockers, results, integrity, launchAttemptCount,
  });
};

export const buildAiGovernanceValidationExecutionPreflight = options => runAiGovernanceValidationExecution({
  ...options,
  execute: false,
});
