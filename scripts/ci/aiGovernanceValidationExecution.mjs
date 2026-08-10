// 生成闭字段 validation execution receipt；任何启动前 blocker 都保持零执行。

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
  captureAiGovernanceValidationExecutionState,
  observeAiGovernanceValidationExecutionState,
} from './aiGovernanceValidationExecutionState.mjs';
import {
  cleanupJsonutilsValidationRuntime,
  createJsonutilsValidationRuntime,
  resolveJsonutilsValidationRoot,
  validateJsonutilsValidationRoot,
  validateJsonutilsValidationRuntime,
} from './aiGovernanceValidationWorkspaceRuntime.mjs';

const SHA256 = /^[0-9a-f]{64}$/;
const stableSort = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const isPlainObject = value => value !== null && typeof value === 'object'
  && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const failure = code => Object.assign(new Error(code), { code });

const mergeBlockers = (...groups) => {
  const counts = new Map();
  groups.flat().forEach(({ code, count = 1 }) => counts.set(code, Math.max(counts.get(code) ?? 0, count)));
  return [...counts].sort(([left], [right]) => stableSort(left, right))
    .map(([code, count]) => ({ code, count }));
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
  captureState = captureAiGovernanceValidationExecutionState,
  observeState = observeAiGovernanceValidationExecutionState,
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
    before = await captureState({ rootBinding });
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
          const observation = await observeState({
            rootBinding, before, currentIntegrity: observedIntegrity,
          });
          observedIntegrity = observation.integrity;
          if (observation.blockers.length > 0) {
            blockers = mergeBlockers(blockers, observation.blockers);
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
          const observation = await observeState({
            rootBinding, before, currentIntegrity: observedIntegrity,
          });
          observedIntegrity = observation.integrity;
          if (observation.blockers.length > 0) {
            blockers = mergeBlockers(blockers, observation.blockers);
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

  let finalCaptureFailed = false;
  try {
    if (bindings) {
      validateBindings(bindings, rootBinding);
      executableBindingsStable = executableBindingsStable !== false;
    }
    const observation = await observeState({
      rootBinding, before, currentIntegrity: observedIntegrity,
    });
    observedIntegrity = observation.integrity;
    blockers = mergeBlockers(blockers, observation.blockers);
    if (observation.blockers.length > 0) executionFailure = true;
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
