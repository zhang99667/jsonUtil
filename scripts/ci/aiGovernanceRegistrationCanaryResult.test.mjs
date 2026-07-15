import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import {
  buildRegistrationCanaryPacketBundle,
  hashRegistrationCanaryPacketValue,
} from './aiGovernanceRegistrationCanaryPacket.mjs';
import {
  collectRegistrationCanaryBlindResultFailures,
  gradeRegistrationCanaryResultBlind,
} from './aiGovernanceRegistrationCanaryResult.mjs';
import {
  bindRegistrationCanaryReviewToCheckpoint,
  buildRegistrationCanaryGradeCheckpointRequest,
} from './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';
import {
  parseRegistrationCanaryHostRunRecord,
  sealRegistrationCanaryBlindGradeSet,
  unblindRegistrationCanaryGradeSet,
} from './aiGovernanceRegistrationCanaryReview.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const corpus = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/cases.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/experiments.json'), 'utf8'));
const caseItem = corpus.cases.find(item => item.id === 'mcp-project-registration-discovery');
const experiment = manifest.experiments.find(item => item.id === 'mcp-project-registration-canary');
const policies = buildEvolutionTracePolicyRegistry({ rootDir });
const policyEntry = policies.policiesByCaseId.get(caseItem.id);
const fixtureRevision = resolveEvolutionWorktreeRevision(rootDir);
const digest = character => character.repeat(64);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const packetHash = hashRegistrationCanaryPacketValue;
const executionOrder = [
  'mcp-registration-p1-baseline', 'mcp-registration-p1-candidate',
  'mcp-registration-p2-candidate', 'mcp-registration-p2-baseline',
  'mcp-registration-p3-baseline', 'mcp-registration-p3-candidate',
];
const packetPrivacy = {
  sourceUserContentStored: false, reasoningStored: false, toolPayloadStored: false,
  authMaterialStored: false, userConfigStored: false, absoluteUserPathStored: false,
};
const resultPrivacy = {
  ...packetPrivacy, responseBodyStored: false, traceBodyStored: false,
  armStored: false, rubricStored: false,
};
const reviewPrivacy = {
  ...packetPrivacy, responseBodyStored: false, traceBodyStored: false,
};
const ledger = (name, character) => ({
  path: `evals/ai-governance/${name}`,
  records: 1,
  headSequence: 1,
  headSha256: digest(character),
  fileSha256: digest(character),
});
const bindings = {
  fixtureRevision,
  artifacts: {
    caseDescriptor: { path: 'evals/ai-governance/cases.json', sha256: digest('a') },
    experimentDescriptor: { path: 'evals/ai-governance/experiments.json', sha256: digest('b') },
    projectMcp: { path: '.mcp.json', sha256: digest('c') },
    projectHooks: { path: '.codex/hooks.json', sha256: digest('d') },
  },
  ledgers: {
    outcomes: ledger('outcomes.jsonl', 'e'),
    receipts: ledger('trial-receipts.jsonl', 'f'),
    feedback: ledger('feedback-inbox.jsonl', '1'),
  },
};
const environmentSha256 = digest('2');
const buildPacket = trialId => buildRegistrationCanaryPacketBundle({
  corpusVersion: corpus.corpusVersion,
  manifestVersion: manifest.manifestVersion,
  caseItem,
  experiment,
  trialId,
  runNonce: digest('3'),
  environmentSha256,
  bindings,
});
const packetBundles = executionOrder.map(buildPacket);

const buildTrace = (bundle, { discovered = true } = {}) => {
  const events = [{ sequence: 1, type: 'session.start', actorId: 'root' }];
  if (discovered) events.push(
    { sequence: 2, type: 'mcp.call', actorId: 'root', operationId: `op-${packetHash('jsonutils.registration-canary.blind-trace-operation/v1', bundle.agent.blindTrialAlias).slice(0, 24)}`, name: 'jsonutils-governance/ai_governance_scorecard', status: 'started', keys: [] },
    { sequence: 3, type: 'mcp.result', actorId: 'root', operationId: `op-${packetHash('jsonutils.registration-canary.blind-trace-operation/v1', bundle.agent.blindTrialAlias).slice(0, 24)}`, name: 'jsonutils-governance/ai_governance_scorecard', status: 'passed', keys: ['maturityScorecard.nextFocus.id'] },
  );
  events.push(
    { sequence: events.length + 1, type: 'response.finish', actorId: 'root', sha256: digest('4'), status: 'passed' },
    { sequence: events.length + 2, type: 'session.finish', actorId: 'root', status: 'passed' },
  );
  return {
    schemaVersion: 1,
    adapter: { id: 'codex-exec-jsonl', version: '1.2.0' },
    capture: {
      status: 'complete', sampling: 'all', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
    },
    caseSha256: hashEvolutionTraceValue(caseItem),
    policy: structuredClone(policyEntry.descriptor),
    beforeRevision: bundle.host.bindings.fixtureRevision,
    afterRevision: bundle.host.bindings.fixtureRevision,
    events,
  };
};

const refreshResultDigests = (result) => {
  result.outputSha256 = result.trace.events.find(event => event.type === 'response.finish').sha256;
  result.bindings.observationSha256 = packetHash('jsonutils.registration-canary.observation/v1', result.observation);
  result.bindings.traceSha256 = packetHash('jsonutils.registration-canary.trace/v1', result.trace);
  return result;
};

const buildResult = (bundle, options = {}) => {
  const observation = options.observation ?? {
    registrySurface: 'codex-task-registry',
    serverDiscovery: 'discovered',
    toolDiscovery: 'discovered',
    fallback: 'none',
    infrastructure: 'reported-valid',
  };
  const trace = options.trace ?? buildTrace(bundle);
  return refreshResultDigests({
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-blind-result',
    dataClass: 'redacted',
    resultVersion: '1.0.0',
    blindTrialAlias: bundle.agent.blindTrialAlias,
    bindings: {
      agentPacketSha256: bundle.host.projectionDigests.agentSha256,
      graderPacketSha256: bundle.host.projectionDigests.graderSha256,
      fixtureRevision: bundle.host.bindings.fixtureRevision,
      environmentSha256: bundle.host.bindings.environmentSha256,
      observationSha256: digest('0'),
      traceSha256: digest('0'),
    },
    execution: {
      terminalStatus: 'completed', exitCode: 0, stdoutDrained: true,
      timedOut: false, binaryStable: true, outputLimitExceeded: false,
      ...(options.execution ?? {}),
    },
    observation,
    outputSha256: digest('0'),
    trace,
    claims: {
      executionReported: true, executionVerified: false,
      automaticLedgerWrites: false, outcomeEligible: false,
    },
    privacy: { ...resultPrivacy },
  });
};
const gradeResult = (bundle, result) => gradeRegistrationCanaryResultBlind({
  resultJson: JSON.stringify(result),
  agentPacket: bundle.agent,
  graderPacket: bundle.grader,
  caseItem,
  policyEntry,
  expectedFixtureRevision: fixtureRevision,
});
const passingResults = packetBundles.map(bundle => buildResult(bundle));
const passingGrades = packetBundles.map((bundle, index) => gradeResult(bundle, passingResults[index]));

const buildHostRunRecord = (bundle, index, overrides = {}) => ({
  schemaVersion: 1,
  artifactType: 'ai-registration-canary-host-run-record',
  dataClass: 'redacted',
  recordVersion: '1.0.0',
  blindTrialAlias: bundle.host.blindTrialAlias,
  hostPacketSha256: packetHash('jsonutils.registration-canary.host-packet/v1', bundle.host),
  hostBindingsSha256: packetHash('jsonutils.registration-canary.host-bindings/v1', bundle.host.bindings),
  leaseKeySha256: bundle.host.lease.keySha256,
  taskInstanceSha256: sha256(`task-${index + 1}`),
  executionOrdinal: bundle.host.trial.executionOrdinal,
  leaseAcquireCount: 1,
  executionCount: 1,
  retryCount: 0,
  freshTaskObserved: true,
  armIsolationObserved: true,
  registryObserved: true,
  pluginStateObserved: bundle.host.treatment.personalPluginExpectedEnabled ? 'enabled' : 'disabled',
  artifactBindingsStable: true,
  ledgerBindingsStable: true,
  claims: {
    executionReported: true, executionVerified: false,
    automaticLedgerWrites: false, outcomeEligible: false,
  },
  privacy: { ...reviewPrivacy },
  ...overrides,
});
const passingRecords = packetBundles.map((bundle, index) => buildHostRunRecord(bundle, index));

test('registration canary blind result 复用 observable trace 并生成无 arm 的确定性 grade', () => {
  assert.deepEqual(policies.failures, []);
  assert.deepEqual(collectRegistrationCanaryBlindResultFailures(passingResults[0]), []);
  const grade = passingGrades[0];
  assert.deepEqual(grade.grade, { status: 'graded', verdict: 'pass', score: 100 });
  assert.deepEqual(grade.reasonCodes, ['registration-and-tool-discovered']);
  assert.equal(grade.traceReview.policyStatus, 'verified');
  assert.doesNotMatch(JSON.stringify(grade), /"(?:arm|treatment|pair|trialId|executionOrdinal|pluginState)"/);
  assert.doesNotMatch(JSON.stringify(grade), /hostPacketSha256|hostBindingsSha256|leaseKeySha256/);
  assert.equal(grade.claims.outcomeEligible, false);
  assert.equal(grade.claims.trusted, false);
});

test('registration canary blind grade 区分 behavior fail 与 infrastructure-invalid', () => {
  const missing = buildResult(packetBundles[0], {
    observation: {
      registrySurface: 'codex-task-registry', serverDiscovery: 'missing',
      toolDiscovery: 'missing', fallback: 'none', infrastructure: 'reported-valid',
    },
    trace: buildTrace(packetBundles[0], { discovered: false }),
  });
  const failedGrade = gradeResult(packetBundles[0], missing);
  assert.deepEqual(failedGrade.grade, { status: 'graded', verdict: 'fail', score: 0 });
  assert.ok(failedGrade.reasonCodes.includes('server-not-discovered'));
  assert.ok(failedGrade.reasonCodes.includes('trace-policy-not-satisfied'));

  const timeout = buildResult(packetBundles[0], { execution: { terminalStatus: 'interrupted', timedOut: true } });
  const infrastructureGrade = gradeResult(packetBundles[0], timeout);
  assert.deepEqual(infrastructureGrade.grade, { status: 'ungradable', verdict: null, score: null });
  assert.ok(infrastructureGrade.reasonCodes.includes('capture-timeout'));

  const fallback = buildResult(packetBundles[0]);
  fallback.observation.fallback = 'shell';
  refreshResultDigests(fallback);
  assert.equal(gradeResult(packetBundles[0], fallback).grade.status, 'ungradable');
});

test('registration canary blind result 对 caller grade、digest、trace 与 stale binding fail closed', () => {
  const callerGrade = structuredClone(passingResults[0]);
  callerGrade.verdict = 'pass';
  assert.throws(() => gradeResult(packetBundles[0], callerGrade), /闭字段|禁止盲评字段/);

  const observationDrift = structuredClone(passingResults[0]);
  observationDrift.observation.serverDiscovery = 'missing';
  assert.throws(() => gradeResult(packetBundles[0], observationDrift), /observation digest 漂移/);

  const outputDrift = structuredClone(passingResults[0]);
  outputDrift.outputSha256 = digest('5');
  assert.throws(() => gradeResult(packetBundles[0], outputDrift), /唯一 response\.finish/);

  assert.throws(() => gradeRegistrationCanaryResultBlind({
    resultJson: JSON.stringify(passingResults[0]),
    agentPacket: packetBundles[0].agent,
    graderPacket: packetBundles[0].grader,
    caseItem,
    policyEntry,
    expectedFixtureRevision: `worktree-${digest('6')}`,
  }), /已过期/);

  const nonCompact = `${JSON.stringify(passingResults[0], null, 2)}\n`;
  assert.throws(() => gradeRegistrationCanaryResultBlind({
    resultJson: nonCompact,
    agentPacket: packetBundles[0].agent,
    graderPacket: packetBundles[0].grader,
    caseItem,
    policyEntry,
  }), /精确紧凑 JSON/);
});

test('registration canary blind grading 绑定当前 case 并拒绝 trace arm 侧信道', () => {
  const agentPacket = structuredClone(packetBundles[0].agent);
  const result = structuredClone(passingResults[0]);
  agentPacket.input.request = `${agentPacket.input.request} tampered`;
  result.bindings.agentPacketSha256 = packetHash('jsonutils.registration-canary.agent-packet/v1', agentPacket);
  assert.throws(() => gradeRegistrationCanaryResultBlind({
    resultJson: JSON.stringify(result), agentPacket, graderPacket: packetBundles[0].grader,
    caseItem, policyEntry, expectedFixtureRevision: fixtureRevision,
  }), /当前 case 内容/);
  for (const mutate of [
    leaked => leaked.trace.events.filter(event => event.operationId).forEach(event => { event.operationId = 'candidate'; }),
    leaked => { leaked.trace.events.find(event => event.type === 'mcp.call').name = 'candidate'; }, leaked => { leaked.trace.events.find(event => event.type === 'mcp.result').keys.push('cohort_b'); },
  ]) { const leaked = structuredClone(passingResults[0]); mutate(leaked); refreshResultDigests(leaked); assert.match(collectRegistrationCanaryBlindResultFailures(leaked).join('\n'), /侧信道/); }
});

test('registration canary adapter 与 discovery unavailable 归为 infrastructure ungradable', () => {
  const adapterDrift = structuredClone(passingResults[0]);
  adapterDrift.trace.adapter.version = '9.9.9';
  refreshResultDigests(adapterDrift);
  assert.deepEqual(gradeResult(packetBundles[0], adapterDrift).grade, { status: 'ungradable', verdict: null, score: null });
  const unavailable = buildResult(packetBundles[0]);
  unavailable.observation.serverDiscovery = unavailable.observation.toolDiscovery = 'unavailable';
  refreshResultDigests(unavailable);
  assert.equal(gradeResult(packetBundles[0], unavailable).grade.status, 'ungradable');
});

test('registration canary blind grade set 必须六条唯一且在揭盲前封存', () => {
  const gradeSet = sealRegistrationCanaryBlindGradeSet(passingGrades);
  assert.equal(gradeSet.grades.length, 6);
  assert.deepEqual(gradeSet.grades.map(item => item.blindTrialAlias), [...gradeSet.grades.map(item => item.blindTrialAlias)].sort());
  assert.equal(gradeSet.claims.armKnown, false);
  assert.throws(() => sealRegistrationCanaryBlindGradeSet(passingGrades.slice(0, 5)), /必须先完成 6 条/);
  const duplicate = structuredClone(passingGrades);
  duplicate[5] = structuredClone(duplicate[0]);
  assert.throws(() => sealRegistrationCanaryBlindGradeSet(duplicate), /必须唯一/);
  const contradictory = structuredClone(passingGrades);
  contradictory[0].grade.score = 0;
  assert.throws(() => sealRegistrationCanaryBlindGradeSet(contradictory), /语义不一致/);
});

test('registration canary 独立揭盲只输出 external-json-unverified metrics preview', () => {
  const gradeSet = sealRegistrationCanaryBlindGradeSet(passingGrades);
  const review = unblindRegistrationCanaryGradeSet({
    packetBundles,
    blindGrades: passingGrades,
    gradeSet,
    hostRunRecords: passingRecords,
    expectedFixtureRevision: fixtureRevision,
  });
  assert.equal(review.status, 'review-only');
  assert.equal(review.trust.captureOrigin, 'external-json-unverified');
  assert.equal(review.trust.trustedSigners, 0);
  assert.equal(review.trust.executionOrderVerified, false);
  assert.deepEqual(review.trials.map(item => item.executionOrdinal), [1, 2, 3, 4, 5, 6]);
  assert.equal(review.metrics.passAt1.status, 'preview');
  assert.deepEqual([review.metrics.passAt1.baseline, review.metrics.passAt1.candidate], [1, 1]);
  assert.equal(review.metrics.pairedDelta.value, 0);
  assert.equal(review.metrics.passPower3.status, 'unavailable');
  assert.equal(review.metrics.timing.status, 'unavailable');
  assert.equal(review.metrics.cost.status, 'unavailable');
  assert.deepEqual(review.writebackCandidate, {
    status: 'blocked', reasonCode: 'external-results-unverified',
    schemaUpgradeRequired: true, automaticWrite: false,
  });
  assert.ok(Object.values(review.claims).every(value => value === false));

  const checkpointInput = {
    gradeSet, blindGrades: passingGrades, caseItem,
    experimentRef: { id: experiment.id, manifestVersion: manifest.manifestVersion },
    policyEntry, expectedFixtureRevision: fixtureRevision,
  };
  const request = buildRegistrationCanaryGradeCheckpointRequest(checkpointInput);
  const bindInput = {
    requestJson: JSON.stringify(request), packetBundles, hostRunRecords: passingRecords,
    ...checkpointInput,
  };
  const bound = bindRegistrationCanaryReviewToCheckpoint(bindInput);
  assert.equal(bound.checkpoint.anchorStatus, 'external-anchor-required');
  assert.equal(bound.writebackCandidate.status, 'blocked');
  assert.equal(bound.writebackCandidate.reasonCode, 'external-checkpoint-required');
  const callerReview = structuredClone(review);
  callerReview.status = 'pass';
  callerReview.claims.outcomeEligible = true;
  callerReview.writebackCandidate = { status: 'ready', automaticWrite: true };
  assert.throws(() => bindRegistrationCanaryReviewToCheckpoint({
    ...bindInput, review: callerReview,
  }), /闭字段/);
  for (const mutate of [
    changed => { changed.gradeSet.commitmentSha256 = sha256('other-grade-set'); },
    changed => { changed.experimentRef.manifestVersion = '9.9.9'; },
  ]) {
    const changed = structuredClone(request);
    mutate(changed);
    assert.throws(() => bindRegistrationCanaryReviewToCheckpoint({
      ...bindInput, requestJson: JSON.stringify(changed),
    }), /不匹配/);
  }
});

test('registration canary host-only retry、task reuse、plugin 与 order 漂移使指标 unavailable', () => {
  const gradeSet = sealRegistrationCanaryBlindGradeSet(passingGrades);
  const scenarios = [
    (records) => { records[0].retryCount = 1; },
    (records) => { records[1].taskInstanceSha256 = records[0].taskInstanceSha256; },
    (records) => { records[0].pluginStateObserved = 'enabled'; },
    (records) => { [records[0].executionOrdinal, records[1].executionOrdinal] = [records[1].executionOrdinal, records[0].executionOrdinal]; },
    (records) => { records[0].ledgerBindingsStable = false; },
  ];
  for (const mutate of scenarios) {
    const records = structuredClone(passingRecords);
    mutate(records);
    const review = unblindRegistrationCanaryGradeSet({ packetBundles, blindGrades: passingGrades, gradeSet, hostRunRecords: records });
    assert.equal(review.metrics.passAt1.status, 'unavailable');
    assert.ok(review.trials.some(trial => trial.infrastructureStatus === 'invalid-reported'));
    assert.equal(review.claims.outcomeEligible, false);
  }
});

test('registration canary 揭盲拒绝 packet/grade/run record 绑定漂移和封存后改分', () => {
  const gradeSet = sealRegistrationCanaryBlindGradeSet(passingGrades);
  const staleRecord = structuredClone(passingRecords);
  staleRecord[0].hostPacketSha256 = digest('7');
  assert.throws(() => unblindRegistrationCanaryGradeSet({
    packetBundles, blindGrades: passingGrades, gradeSet, hostRunRecords: staleRecord,
  }), /digest\/lease 与 packet 不匹配/);

  const changedGrades = structuredClone(passingGrades);
  changedGrades[0].grade.verdict = 'fail';
  changedGrades[0].grade.score = 0;
  assert.throws(() => unblindRegistrationCanaryGradeSet({
    packetBundles, blindGrades: changedGrades, gradeSet, hostRunRecords: passingRecords,
  }), /未封存或已改变/);

  const recordJson = JSON.stringify(passingRecords[0]);
  assert.deepEqual(parseRegistrationCanaryHostRunRecord(recordJson), passingRecords[0]);
  assert.throws(() => parseRegistrationCanaryHostRunRecord(`${recordJson}\n`), /精确紧凑 JSON/);

  const duplicateLeasePackets = structuredClone(packetBundles);
  const duplicateLeaseRecords = structuredClone(passingRecords);
  duplicateLeasePackets[1].host.lease.keySha256 = duplicateLeasePackets[0].host.lease.keySha256;
  duplicateLeaseRecords[1].leaseKeySha256 = duplicateLeaseRecords[0].leaseKeySha256;
  duplicateLeaseRecords[1].hostPacketSha256 = packetHash('jsonutils.registration-canary.host-packet/v1', duplicateLeasePackets[1].host);
  assert.throws(() => unblindRegistrationCanaryGradeSet({
    packetBundles: duplicateLeasePackets, blindGrades: passingGrades, gradeSet, hostRunRecords: duplicateLeaseRecords,
  }), /lease key 必须唯一/);
});

test('registration canary review CLI 四阶段只读且不修改 experiment/evidence ledger', () => {
  const tracked = ['evals/ai-governance/experiments.json', 'evals/ai-governance/feedback-inbox.jsonl', 'evals/ai-governance/trial-receipts.jsonl', 'evals/ai-governance/outcomes.jsonl'];
  const before = tracked.map(file => fs.readFileSync(path.join(rootDir, file), 'utf8'));
  const run = (stage, input) => {
    const result = spawnSync(process.execPath, ['scripts/ci/review-ai-registration-canary-results.mjs', '--stage', stage], {
      cwd: rootDir,
      input: JSON.stringify(input),
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const cliGrade = run('blind', {
    schemaVersion: 1,
    agentPacket: packetBundles[0].agent,
    graderPacket: packetBundles[0].grader,
    resultJson: JSON.stringify(passingResults[0]),
  });
  assert.deepEqual(cliGrade.grade, { status: 'graded', verdict: 'pass', score: 100 });
  const cliGradeSet = run('seal', { schemaVersion: 1, blindGrades: passingGrades });
  const checkpointRequest = run('checkpoint', {
    schemaVersion: 1, blindGrades: passingGrades, gradeSet: cliGradeSet,
  });
  const cliReview = run('unblind', {
    schemaVersion: 1,
    packetBundles,
    blindGrades: passingGrades,
    gradeSet: cliGradeSet,
    checkpointRequestJson: JSON.stringify(checkpointRequest),
    hostRunRecordJsons: passingRecords.map(JSON.stringify),
  });
  assert.equal(cliReview.writebackCandidate.status, 'blocked');
  assert.equal(cliReview.checkpoint.anchorStatus, 'external-anchor-required');
  assert.deepEqual(tracked.map(file => fs.readFileSync(path.join(rootDir, file), 'utf8')), before);
  const source = fs.readFileSync(path.join(rootDir, 'scripts/ci/review-ai-registration-canary-results.mjs'), 'utf8');
  assert.doesNotMatch(source, /writeFile|appendFile|child_process|fetch\(|config\.toml|\/Users\//);
  const invalid = spawnSync(process.execPath, ['scripts/ci/review-ai-registration-canary-results.mjs', '--stage', 'all'], {
    cwd: rootDir, input: '{}', encoding: 'utf8',
  });
  assert.notEqual(invalid.status, 0);
});
