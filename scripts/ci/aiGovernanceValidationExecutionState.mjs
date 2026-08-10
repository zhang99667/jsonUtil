// 单源维护 validation execution 的权威状态捕获、摘要与漂移比较。

import { createHash } from 'node:crypto';

import { buildJsonutilsValidationPlan } from '../mcp/jsonutils-governance-validation-plan.mjs';
import { snapshotCodexFixedMcpTrialLedgers } from './aiGovernanceCodexFixedMcpTrialLedger.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import { collectAuthoritativeValidationChangedSet } from './aiGovernanceValidationChangedSet.mjs';
import {
  hashJsonutilsValidationCommandDescriptor,
  resolveJsonutilsValidationCommandDisplays,
} from './aiGovernanceValidationCommandRegistry.mjs';
import { validateJsonutilsValidationRoot } from './aiGovernanceValidationWorkspaceRuntime.mjs';

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

const collectStateBlockers = ({ changedSet, plan, commands }) => {
  const blockers = [];
  if (!SHA256.test(changedSet.stateSha256 ?? '')) blockers.push({ code: 'RAW_CHANGED_SET_STATE_REQUIRED', count: 1 });
  if (!changedSet.ok) blockers.push({ code: 'AUTHORITATIVE_CHANGED_SET_INVALID', count: Math.max(1, changedSet.issues.length) });
  if (!plan.ok) blockers.push({ code: 'VALIDATION_PLAN_INVALID', count: 1 });
  if (plan.changedFileCount !== changedSet.changedFileCount
    || plan.coverage.totalChangedFileCount !== changedSet.changedFileCount
    || plan.authority.issueCount !== changedSet.issues.length) blockers.push({ code: 'VALIDATION_PLAN_INVALID', count: 1 });
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

export const captureAiGovernanceValidationExecutionState = async ({
  rootBinding,
  validateRoot = validateJsonutilsValidationRoot,
  collectChangedSet = collectAuthoritativeValidationChangedSet,
  buildPlan = defaultBuildPlan,
  resolveCommands = resolveJsonutilsValidationCommandDisplays,
  resolveRevision = resolveEvolutionWorktreeRevision,
  snapshotLedgers = snapshotCodexFixedMcpTrialLedgers,
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

const mergeIntegrityValue = (current, observed) => (
  current === false || observed === false ? false
    : current === null || observed === null ? null : true
);

export const observeAiGovernanceValidationExecutionState = async ({
  before,
  currentIntegrity,
  ...captureOptions
}) => {
  const after = await captureAiGovernanceValidationExecutionState(captureOptions);
  const observed = {
    sourceRevisionStable: before.revision === after.revision,
    changedSetStable: before.digests.changedSetStateSha256 === after.digests.changedSetStateSha256
      && before.digests.changedSetSha256 === after.digests.changedSetSha256,
    validationPlanStable: before.digests.planSha256 === after.digests.planSha256,
    commandRegistryStable: before.digests.commandSetSha256 === after.digests.commandSetSha256,
    ledgerEndpointsStable: before.digests.ledgerEndpointsSha256 === after.digests.ledgerEndpointsSha256,
  };
  const blockers = [];
  if (!observed.sourceRevisionStable) blockers.push({ code: 'SOURCE_REVISION_DRIFT', count: 1 });
  if (!observed.changedSetStable) blockers.push({ code: 'CHANGED_SET_DRIFT', count: 1 });
  if (!observed.validationPlanStable) blockers.push({ code: 'VALIDATION_PLAN_DRIFT', count: 1 });
  if (!observed.commandRegistryStable) blockers.push({ code: 'COMMAND_REGISTRY_DRIFT', count: 1 });
  if (!observed.ledgerEndpointsStable) blockers.push({ code: 'LEDGER_ENDPOINT_DRIFT', count: 1 });
  const integrity = Object.fromEntries(Object.entries(currentIntegrity).map(([key, value]) => (
    [key, Object.hasOwn(observed, key) ? mergeIntegrityValue(value, observed[key]) : value]
  )));
  return { state: after, integrity, blockers: mergeBlockers(blockers) };
};
