import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAiGovernanceValidationExecutionPreflight,
  runAiGovernanceValidationExecution,
} from './aiGovernanceValidationExecution.mjs';
import { isClosedAiGovernanceValidationExecutionReport } from './aiGovernanceValidationExecutionReceipt.mjs';
import {
  changedSet,
  dependencies,
  fakeRuntime,
  fixtureCommand,
  ledgerSnapshot,
  plan,
  stateA,
  stateB,
} from './aiGovernanceValidationExecutionTestFixtures.mjs';
import { runAiValidationExecutionCli } from './run-ai-validation-execution.mjs';

test('manual checks block before executable binding, runtime creation, or spawn', async () => {
  let bindCount = 0, runtimeCount = 0, spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), {
      planOptions: { manual: true },
      dependencies: {
        bindExecutables: () => { bindCount += 1; throw new Error('must not bind'); },
        createRuntime: () => { runtimeCount += 1; throw new Error('must not create'); },
        spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; },
      },
    }),
    execute: true,
  });

  assert.equal(report.status, 'blocked');
  assert.deepEqual(report.blockers, [{ code: 'MANUAL_CHECKS_REQUIRED', count: 1 }]);
  assert.equal(bindCount, 0);
  assert.equal(runtimeCount, 0);
  assert.equal(spawnCount, 0);
  assert.equal(report.execution.launchAttemptCount, 0);
  assert.equal(report.commands[0].status, 'not-run');
});

test('preview returns a component receipt without executable or runtime activity', async () => {
  let spawnCount = 0;
  const report = await buildAiGovernanceValidationExecutionPreflight({
    ...dependencies(() => changedSet(), {
      dependencies: { spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; } },
    }),
  });

  assert.equal(report.status, 'ready');
  assert.equal(report.ok, true);
  assert.equal(report.evidenceScope, 'component-only');
  assert.equal(report.outcomeEligible, false);
  assert.equal(report.source.changedSetStateSha256, stateA);
  assert.equal(report.source.executableSetSha256, null);
  assert.equal(report.execution.requested, false);
  assert.equal(report.execution.descendantProcessQuiescenceVerified, false);
  assert.equal(report.claims.behaviorValidated, false);
  assert.equal(report.claims.ledgerWriteAbsenceVerified, false);
  assert.equal(isClosedAiGovernanceValidationExecutionReport(report, false), true);
  assert.equal(spawnCount, 0);
});

test('run uses per-command clean env and emits only direct component exit facts', async () => {
  const secret = 'secret-marker-must-not-escape';
  const observed = [];
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), {
      dependencies: {
        spawnCommand: ({ env }) => {
          observed.push(env);
          return { status: 0, signal: null, stdout: secret, stderr: secret };
        },
      },
    }),
    execute: true,
    ambientEnv: {
      PATH: `/malicious/${secret}`,
      NODE_OPTIONS: secret,
      OPENAI_API_KEY: secret,
      GITHUB_STEP_SUMMARY: secret,
      GITHUB_ENV: secret,
      GITHUB_OUTPUT: secret,
    },
  });

  assert.equal(report.status, 'completed-component');
  assert.equal(report.ok, true);
  assert.equal(report.execution.launchAttemptCount, 1);
  assert.equal(report.commands[0].status, 'exited-zero');
  assert.equal(report.commands[0].executableSha256, 'f'.repeat(64));
  assert.equal(isClosedAiGovernanceValidationExecutionReport(report, true), true);
  assert.equal(observed.length, 1);
  for (const key of ['NODE_OPTIONS', 'OPENAI_API_KEY', 'GITHUB_STEP_SUMMARY', 'GITHUB_ENV', 'GITHUB_OUTPUT']) {
    assert.equal(observed[0][key], undefined);
  }
  assert.equal(observed[0].PATH, '/usr/bin:/bin');
  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes('stdout'), false);
  assert.equal(serialized.includes('stderr'), false);
  assert.equal(serialized.includes('argv'), false);
  assert.equal(serialized.includes('/trusted/'), false);
});

test('synchronous launcher failure records only a launch attempt', async () => {
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), {
      dependencies: { spawnCommand: () => { throw new Error('no child'); } },
    }),
    execute: true,
  });

  assert.equal(report.status, 'failed');
  assert.equal(report.execution.launchAttemptCount, 1);
  assert.equal(report.commands[0].status, 'launch-error');
  assert.ok(report.blockers.some(item => item.code === 'VALIDATION_COMMAND_FAILED'));
  assert.equal(JSON.stringify(report).includes('childCreated'), false);
});

test('invalid executable bindings block before runtime creation or spawn', async () => {
  let runtimeCount = 0, spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), { dependencies: {
      bindExecutables: () => ({ malformed: true }),
      createRuntime: () => { runtimeCount += 1; return fakeRuntime(); },
      spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; },
    } }),
    execute: true,
  });

  assert.deepEqual(report.blockers, [{ code: 'VALIDATION_EXECUTABLE_BINDING_FAILED', count: 1 }]);
  assert.equal(runtimeCount, 0);
  assert.equal(spawnCount, 0);
  assert.equal(report.commands[0].status, 'not-run');
});

test('executable binding integrity cannot recover from observed drift', async () => {
  let validationCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), { dependencies: {
      validateBindings: () => { if ((validationCount += 1) === 3) throw new Error('drift'); },
    } }),
    execute: true,
  });

  assert.equal(report.status, 'failed');
  assert.equal(report.integrity.executableBindingsStable, false);
});

test('registry display commands remain ordered and bound to the plan', async () => {
  let spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), { dependencies: {
      resolveCommands: () => [{ ...fixtureCommand, displayCommand: 'different command' }],
      spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; },
    } }),
    execute: true,
  });

  assert.ok(report.blockers.some(item => item.code === 'COMMAND_REGISTRY_INVALID'));
  assert.equal(spawnCount, 0);
});

test('plan counts must bind the same authoritative changed set', async () => {
  let spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), { dependencies: {
      buildPlan: input => ({ ...plan(input), changedFileCount: input.changedSet.changedFileCount + 1 }),
      spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; },
    } }),
    execute: true,
  });

  assert.ok(report.blockers.some(item => item.code === 'VALIDATION_PLAN_INVALID'));
  assert.equal(spawnCount, 0);
});

test('ledger endpoint digest is independent of snapshot order', async () => {
  let snapshotCount = 0;
  const report = await buildAiGovernanceValidationExecutionPreflight({
    ...dependencies(() => changedSet(), { dependencies: {
      snapshotLedgers: async () => (snapshotCount++ === 0 ? ledgerSnapshot : [...ledgerSnapshot].reverse()),
    } }),
  });

  assert.equal(report.status, 'ready');
  assert.equal(report.blockers.some(item => item.code === 'LEDGER_ENDPOINT_DRIFT'), false);
});

test('runtime validation failure cleans created state and remains a closed blocked receipt', async () => {
  let cleanupCount = 0, spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), { dependencies: {
      validateRuntime: () => { throw new Error('invalid runtime'); },
      cleanupRuntime: () => { cleanupCount += 1; return true; },
      spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; },
    } }),
    execute: true,
  });

  assert.equal(report.status, 'blocked');
  assert.equal(cleanupCount, 1);
  assert.equal(spawnCount, 0);
  assert.equal(isClosedAiGovernanceValidationExecutionReport(report, true), true);
});

test('command environment failure is not counted as a launch attempt', async () => {
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), { dependencies: {
      buildEnvironment: () => { throw new Error('environment unavailable'); },
    } }),
    execute: true,
  });

  assert.equal(report.status, 'failed');
  assert.equal(report.execution.launchAttemptCount, 0);
  assert.equal(report.commands[0].status, 'skipped');
  assert.equal(report.commands[0].failureCode, 'command-preparation-failed');
  assert.equal(isClosedAiGovernanceValidationExecutionReport(report, true), true);
});

test('missing changed-set state digest blocks with zero spawn', async () => {
  let spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(['AGENTS.md'], null), {
      dependencies: { spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; } },
    }),
    execute: true,
  });

  assert.ok(report.blockers.some(item => item.code === 'RAW_CHANGED_SET_STATE_REQUIRED'));
  assert.equal(report.source.changedSetStateSha256, null);
  assert.equal(report.execution.launchAttemptCount, 0);
  assert.equal(spawnCount, 0);
});

test('first-spawn preflight drift is caught before any launch', async () => {
  let collectCount = 0, spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(['AGENTS.md'], collectCount++ === 0 ? stateA : stateB), {
      dependencies: { spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; } },
    }),
    execute: true,
  });

  assert.equal(report.status, 'failed');
  assert.equal(spawnCount, 0);
  assert.equal(report.execution.launchAttemptCount, 0);
  assert.equal(report.commands[0].status, 'skipped');
  assert.ok(report.blockers.some(item => item.code === 'CHANGED_SET_DRIFT'));
});

test('post-command capture exception preserves the launch receipt and count', async () => {
  let collectCount = 0, spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => {
      collectCount += 1;
      if (collectCount === 3) throw new Error('sensitive/post/path');
      return changedSet();
    }, {
      dependencies: { spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; } },
    }),
    execute: true,
  });

  assert.equal(report.status, 'failed');
  assert.equal(spawnCount, 1);
  assert.equal(report.execution.launchAttemptCount, 1);
  assert.equal(report.commands[0].status, 'exited-zero');
  assert.ok(report.blockers.some(item => item.code === 'POST_COMMAND_STATE_CAPTURE_FAILED'));
  assert.equal(report.integrity.changedSetStable, null);
  assert.equal(JSON.stringify(report).includes('sensitive/post/path'), false);
});

test('post-command runtime validation failure cannot leave integrity true', async () => {
  let validations = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), {
      dependencies: { validateRuntime: () => { if ((validations += 1) === 3) throw new Error('drift'); } },
    }),
    execute: true,
  });

  assert.equal(report.status, 'failed');
  assert.equal(report.execution.launchAttemptCount, 1);
  assert.equal(report.integrity.runtimeBoundaryStable, false);
  assert.equal(report.integrity.sourceRevisionStable, null);
  assert.ok(report.blockers.some(item => item.code === 'POST_COMMAND_STATE_CAPTURE_FAILED'));
});

test('final capture exception after a command never collapses to zero-spawn preflight', async () => {
  let collectCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => {
      collectCount += 1;
      if (collectCount === 4) throw new Error('sensitive/final/path');
      return changedSet();
    }, {
      dependencies: { spawnCommand: () => ({ status: 0, signal: null }) },
    }),
    execute: true,
  });

  assert.equal(report.execution.launchAttemptCount, 1);
  assert.equal(report.commands[0].status, 'exited-zero');
  assert.deepEqual(report.blockers, [{ code: 'POST_EXECUTION_STATE_CAPTURE_FAILED', count: 1 }]);
  assert.deepEqual(report.integrity, {
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
});

test('cleanup exception preserves direct result and stops the remaining boundary', async () => {
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(), {
      dependencies: {
        cleanupRuntime: () => { throw new Error('cleanup failed'); },
        spawnCommand: () => ({ status: 1, signal: null }),
      },
    }),
    execute: true,
  });

  assert.equal(report.execution.launchAttemptCount, 1);
  assert.equal(report.commands[0].status, 'exited-nonzero');
  assert.ok(report.blockers.some(item => item.code === 'RUNTIME_CLEANUP_FAILED'));
  assert.ok(report.blockers.some(item => item.code === 'VALIDATION_COMMAND_FAILED'));
});

test('unclassified files block all execution', async () => {
  let spawnCount = 0;
  const report = await runAiGovernanceValidationExecution({
    ...dependencies(() => changedSet(['unknown.bin']), {
      planOptions: { unclassified: 1 },
      dependencies: { spawnCommand: () => { spawnCount += 1; return { status: 0, signal: null }; } },
    }),
    execute: true,
  });

  assert.deepEqual(report.blockers, [{ code: 'UNCLASSIFIED_FILES', count: 1 }]);
  assert.equal(report.execution.launchAttemptCount, 0);
  assert.equal(spawnCount, 0);
});

test('malformed dependency values collapse to a fixed path-free failure', async () => {
  const report = await buildAiGovernanceValidationExecutionPreflight({
    ...dependencies(() => changedSet(), {
      dependencies: { resolveRevision: () => 'sensitive/path/should-not-escape' },
    }),
  });

  assert.deepEqual(report.blockers, [{ code: 'VALIDATION_PREFLIGHT_FAILED', count: 1 }]);
  assert.equal(report.execution.launchAttemptCount, 0);
  assert.equal(JSON.stringify(report).includes('sensitive/path'), false);
});

test('execution CLI keeps help zero-read and requires a unique explicit run flag', async () => {
  const output = () => {
    let value = '';
    return { stream: { write: chunk => { value += chunk; } }, read: () => value };
  };
  let runCount = 0;
  const helpOut = output(), helpErr = output();
  assert.equal(await runAiValidationExecutionCli({
    args: ['--help'], stdout: helpOut.stream, stderr: helpErr.stream,
    run: async () => { runCount += 1; },
  }), 0);
  assert.match(helpOut.read(), /^Usage:/);
  assert.equal(helpErr.read(), '');
  assert.equal(runCount, 0);

  for (const args of [['--unknown'], ['--run', '--run'], ['--help', '--json']]) {
    const stdout = output(), stderr = output();
    assert.equal(await runAiValidationExecutionCli({ args, stdout: stdout.stream, stderr: stderr.stream }), 2);
    assert.equal(stdout.read(), '');
    assert.match(stderr.read(), /AI_VALIDATION_EXECUTION_ARGUMENTS_INVALID/);
  }

  let requested;
  const stdout = output(), stderr = output();
  const exitCode = await runAiValidationExecutionCli({
    args: ['--run', '--json'], stdout: stdout.stream, stderr: stderr.stream,
    run: async ({ execute }) => {
      requested = execute;
      return { path: '/sensitive/runtime', body: 'secret' };
    },
  });
  assert.equal(requested, true);
  assert.equal(exitCode, 1);
  assert.equal(JSON.parse(stdout.read()).execution.requested, true);
  assert.equal(stdout.read().includes('/sensitive/runtime'), false);
  assert.equal(stderr.read(), '');

  const valid = await buildAiGovernanceValidationExecutionPreflight(dependencies(() => changedSet()));
  const forgedOut = output();
  assert.equal(await runAiValidationExecutionCli({
    args: ['--run', '--json'], stdout: forgedOut.stream, stderr: output().stream,
    run: async () => ({
      ...valid, status: 'ready', ok: true, source: null, plan: null, integrity: null,
      blockers: [], commands: [], execution: {
        requested: true, launchAttemptCount: 999, descendantProcessQuiescenceVerified: false,
      },
    }),
  }), 1);
  assert.equal(JSON.parse(forgedOut.read()).status, 'failed');
  assert.equal(JSON.parse(forgedOut.read()).execution.launchAttemptCount, 0);
});
