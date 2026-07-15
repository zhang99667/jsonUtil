import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildRegistrationCanaryPacketBundle,
  collectRegistrationCanaryPacketFailures,
} from './aiGovernanceRegistrationCanaryPacket.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const corpus = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/cases.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/experiments.json'), 'utf8'));
const caseItem = corpus.cases.find(item => item.id === 'mcp-project-registration-discovery');
const experiment = manifest.experiments.find(item => item.id === 'mcp-project-registration-canary');
const digest = character => character.repeat(64);
const ledger = (name, character) => ({
  path: `evals/ai-governance/${name}`,
  records: 1, headSequence: 1, headSha256: digest(character), fileSha256: digest(character),
});
const bindings = (revisionCharacter = 'a') => ({
  fixtureRevision: `worktree-${digest(revisionCharacter)}`,
  artifacts: {
    caseDescriptor: { path: 'evals/ai-governance/cases.json', sha256: digest('b') },
    experimentDescriptor: { path: 'evals/ai-governance/experiments.json', sha256: digest('c') },
    projectMcp: { path: '.mcp.json', sha256: digest('d') },
    projectHooks: { path: '.codex/hooks.json', sha256: digest('e') },
  },
  ledgers: {
    outcomes: ledger('outcomes.jsonl', 'f'),
    receipts: ledger('trial-receipts.jsonl', '1'),
    feedback: ledger('feedback-inbox.jsonl', '2'),
  },
});
const build = (trialId = 'mcp-registration-p1-baseline', options = {}) => buildRegistrationCanaryPacketBundle({
  corpusVersion: corpus.corpusVersion, manifestVersion: manifest.manifestVersion,
  caseItem, experiment: options.experiment ?? experiment, trialId,
  runNonce: options.runNonce ?? digest('3'), environmentSha256: options.environmentSha256 ?? digest('4'),
  bindings: options.bindings ?? bindings(),
});

test('registration canary packet 隔离 agent、grader 与 host 三个视图', () => {
  const baseline = build();
  const candidate = build('mcp-registration-p1-candidate');
  assert.deepEqual(collectRegistrationCanaryPacketFailures(baseline), []);
  assert.equal(baseline.agent.blindTrialAlias, baseline.grader.blindTrialAlias);
  assert.equal(baseline.agent.blindTrialAlias, baseline.host.blindTrialAlias);
  assert.equal(JSON.stringify(baseline).includes(digest('3')), false);
  assert.deepEqual(Object.keys(baseline.agent.input), ['request', 'context']);
  assert.doesNotMatch(JSON.stringify(baseline.agent), /expectedOutcome|graders|personalPluginExpectedEnabled|"arm"|"treatment"/);
  assert.doesNotMatch(JSON.stringify(baseline.grader), /personalPluginExpectedEnabled|"arm"|"treatment"/);
  assert.equal(baseline.host.treatment.personalPluginExpectedEnabled, false);
  assert.equal(candidate.host.treatment.personalPluginExpectedEnabled, true);
  assert.notEqual(baseline.agent.blindTrialAlias, candidate.agent.blindTrialAlias);
  assert.deepEqual([build('mcp-registration-p2-candidate').host.trial.executionOrdinal, build('mcp-registration-p2-baseline').host.trial.executionOrdinal], [3, 4]);
  assert.ok([baseline, candidate].every(bundle => bundle.host.claims.outcomeEligible === false));
});

test('registration canary packet 对 grader 泄漏、arm 污染和过度声明 fail closed', () => {
  const mutations = [
    (bundle) => { bundle.agent.expectedOutcome = {}; },
    (bundle) => { bundle.grader.arm = 'baseline'; },
    (bundle) => { bundle.host.treatment.personalPluginExpectedEnabled = true; },
    (bundle) => { bundle.agent.claims.outcomeEligible = true; },
    (bundle) => { bundle.host.preflight.registryObserved = true; },
    (bundle) => { bundle.host.projectionDigests.agentSha256 = digest('0'); },
    (bundle) => { bundle.host.bindings.artifacts.projectMcp.path = '../outside'; },
    (bundle) => { bundle.host.bindings.ledgers.feedback.headSequence = 2; },
  ];
  for (const mutate of mutations) {
    const bundle = structuredClone(build());
    mutate(bundle);
    assert.notDeepEqual(collectRegistrationCanaryPacketFailures(bundle), []);
  }
});

test('registration canary packet 只接受 planned 白名单 trial 和 blocked experiment', () => {
  assert.throws(() => build('../../custom'), /planned 白名单项/);
  const executedTrial = structuredClone(experiment);
  executedTrial.design.trialPlan[0].status = 'executed';
  assert.throws(() => build(undefined, { experiment: executedTrial }), /planned 白名单项/);
  const completed = structuredClone(experiment);
  completed.execution.status = 'completed';
  assert.throws(() => build(undefined, { experiment: completed }), /blocked\/new-task-required/);
  const remapped = structuredClone(experiment);
  remapped.design.trialPlan[0].pair = 3;
  assert.throws(() => build(undefined, { experiment: remapped }), /固定计划不匹配/);
  const tamperedPacket = structuredClone(build());
  tamperedPacket.host.trial.pair = 3;
  assert.match(collectRegistrationCanaryPacketFailures(tamperedPacket).join('\n'), /host trial 不再可启动/);
});

test('registration canary packet 通过 nonce 与 fixture 漂移生成新 blind alias', () => {
  const original = build();
  const newNonce = build(undefined, { runNonce: digest('5') });
  const newFixture = build(undefined, { bindings: bindings('6') });
  assert.notEqual(original.agent.blindTrialAlias, newNonce.agent.blindTrialAlias);
  assert.notEqual(original.agent.blindTrialAlias, newFixture.agent.blindTrialAlias);
  assert.notEqual(original.host.lease.keySha256, newNonce.host.lease.keySha256);
  assert.equal(newFixture.agent.bindings.fixtureRevision, `worktree-${digest('6')}`);
});

test('registration canary CLI 只输出所选投影且不修改治理账本', () => {
  const tracked = ['outcomes.jsonl', 'trial-receipts.jsonl', 'feedback-inbox.jsonl']
    .map(name => path.join(rootDir, 'evals/ai-governance', name));
  const before = tracked.map(file => fs.readFileSync(file, 'utf8'));
  const common = ['--trial', 'mcp-registration-p1-baseline', '--run-nonce', digest('7'), '--environment-sha256', digest('8')];
  const run = projection => JSON.parse(execFileSync(process.execPath, [
    'scripts/ci/prepare-ai-registration-canary.mjs', ...common, '--projection', projection,
  ], { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  const agent = run('agent'), host = run('host');
  assert.equal(agent.artifactType, 'ai-registration-canary-agent-packet');
  assert.equal(host.artifactType, 'ai-registration-canary-host-packet');
  assert.equal(agent.blindTrialAlias, host.blindTrialAlias);
  assert.equal(JSON.stringify(agent).includes(digest('7')), false);
  assert.deepEqual(tracked.map(file => fs.readFileSync(file, 'utf8')), before);
  assert.throws(() => execFileSync(process.execPath, [
    'scripts/ci/prepare-ai-registration-canary.mjs', ...common, '--projection', 'all',
  ], { cwd: rootDir, stdio: 'pipe' }));
  const source = fs.readFileSync(path.join(rootDir, 'scripts/ci/prepare-ai-registration-canary.mjs'), 'utf8');
  assert.doesNotMatch(source, /writeFile|appendFile|child_process|fetch\(|config\.toml|\/Users\//);
});
