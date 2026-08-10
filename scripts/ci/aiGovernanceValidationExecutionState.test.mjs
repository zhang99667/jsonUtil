import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as executionModule from './aiGovernanceValidationExecution.mjs';
import {
  captureAiGovernanceValidationExecutionState,
  observeAiGovernanceValidationExecutionState,
} from './aiGovernanceValidationExecutionState.mjs';
import {
  changedSet,
  dependencies,
  fixtureCommand,
  ledgerSnapshot,
  plan,
  stateA,
  stateB,
} from './aiGovernanceValidationExecutionTestFixtures.mjs';

const captureOptions = (collectChangedSet = () => changedSet(), overrides = {}) => {
  const resolved = dependencies(collectChangedSet, { dependencies: overrides });
  return { ...resolved.stateProviders, rootBinding: resolved.resolveRoot() };
};

test('validation execution state keeps fixed digests and canonical ledger ordering', async () => {
  let snapshotCount = 0;
  const options = captureOptions(() => changedSet(), {
    snapshotLedgers: async () => (snapshotCount++ === 0 ? ledgerSnapshot : [...ledgerSnapshot].reverse()),
  });
  const first = await captureAiGovernanceValidationExecutionState(options);
  const second = await captureAiGovernanceValidationExecutionState(options);

  assert.deepEqual(first.digests, {
    changedSetStateSha256: stateA,
    changedSetSha256: 'ca1b716fc38fe59e4b6f296d77f435ed5cd56231e3f3e80e65996ce52d259aec',
    planSha256: '80e88f3dbb4feaa266f5b6569c8fa5fc9878f39e97108848c4fe85b01d62883c',
    commandSetSha256: '671b1ed882641e3e77d524b392103b63f34d0be71872771f00bf77fdb192a691',
    ledgerEndpointsSha256: '4f8f26ff8e2aa2a1f423ba276e8b3b5bdd3b8061b998e26819e5f9aa3c0a5133',
  });
  assert.equal(second.digests.ledgerEndpointsSha256, first.digests.ledgerEndpointsSha256);
});

test('state observation reports each authority drift without recovering prior integrity', async () => {
  const before = await captureAiGovernanceValidationExecutionState(captureOptions());
  const observed = await observeAiGovernanceValidationExecutionState({
    ...captureOptions(() => changedSet(['AGENTS.md'], stateB), {
      resolveRevision: () => `worktree-${'c'.repeat(64)}`,
      buildPlan: input => ({ ...plan(input), changedFileCount: 2 }),
      resolveCommands: () => [{ ...fixtureCommand, descriptorSha256: 'f'.repeat(64) }],
      snapshotLedgers: async () => ledgerSnapshot.map((item, index) => (
        index === 0 ? { ...item, sha256: '9'.repeat(64) } : item
      )),
    }),
    before,
    currentIntegrity: {
      sourceRevisionStable: false,
      changedSetStable: true,
      validationPlanStable: true,
      commandRegistryStable: null,
      ledgerEndpointsStable: true,
    },
  });

  assert.deepEqual(observed.blockers, [
    { code: 'CHANGED_SET_DRIFT', count: 1 },
    { code: 'COMMAND_REGISTRY_DRIFT', count: 1 },
    { code: 'LEDGER_ENDPOINT_DRIFT', count: 1 },
    { code: 'SOURCE_REVISION_DRIFT', count: 1 },
    { code: 'VALIDATION_PLAN_DRIFT', count: 1 },
  ]);
  assert.deepEqual(observed.integrity, {
    sourceRevisionStable: false,
    changedSetStable: false,
    validationPlanStable: false,
    commandRegistryStable: false,
    ledgerEndpointsStable: false,
  });
});

test('state validation failures expose only fixed path-free codes', async () => {
  await assert.rejects(
    captureAiGovernanceValidationExecutionState(captureOptions(() => changedSet(), {
      snapshotLedgers: async () => [{ path: '/secret/ledger' }],
    })),
    error => error?.code === 'VALIDATION_LEDGER_SNAPSHOT_INVALID'
      && error.message === 'VALIDATION_LEDGER_SNAPSHOT_INVALID'
      && !JSON.stringify(error).includes('/secret/ledger'),
  );
});

test('executor keeps only its two stable public entry points', () => {
  assert.deepEqual(Object.keys(executionModule).sort(), [
    'buildAiGovernanceValidationExecutionPreflight',
    'runAiGovernanceValidationExecution',
  ]);
});
