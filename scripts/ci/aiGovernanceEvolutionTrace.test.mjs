import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  hashEvolutionTraceValue,
  verifyEvolutionTraceReceipt,
} from './aiGovernanceEvolutionTrace.mjs';

const REVISION = 'a'.repeat(40);
const CASE_SHA256 = 'b'.repeat(64);
const POLICY = { id: 'observable-trace-v1', version: '1.0.0', sha256: 'c'.repeat(64) };

const buildReceipt = (traceOverrides = {}) => ({
  schemaVersion: 2,
  revision: REVISION,
  validations: [{ command: 'node scripts/ci/check.mjs', status: 'passed' }],
  trace: {
    schemaVersion: 1,
    adapter: { id: 'test-adapter', version: '1.0.0' },
    capture: {
      status: 'complete',
      sampling: 'all',
      droppedEvents: 0,
      droppedAttributes: 0,
      droppedLinks: 0,
      flushStatus: 'succeeded',
    },
    caseSha256: CASE_SHA256,
    policy: POLICY,
    beforeRevision: 'd'.repeat(40),
    afterRevision: REVISION,
    events: [
      { sequence: 1, type: 'session.start', actorId: 'root' },
      { sequence: 2, type: 'context.read', actorId: 'root', path: 'AGENTS.md', sha256: 'e'.repeat(64) },
      { sequence: 3, type: 'agent.spawn', actorId: 'root', childActorId: 'worker' },
      { sequence: 4, type: 'skill.decision', actorId: 'worker', name: 'jsonutils-ai-infra-evolver', status: 'selected' },
      { sequence: 5, type: 'agent.finish', actorId: 'worker', status: 'passed' },
      { sequence: 6, type: 'validation.start', actorId: 'root', validationIndex: 1, status: 'started' },
      { sequence: 7, type: 'validation.finish', actorId: 'root', validationIndex: 1, status: 'passed' },
      { sequence: 8, type: 'response.finish', actorId: 'root', sha256: 'f'.repeat(64), status: 'passed' },
      { sequence: 9, type: 'session.finish', actorId: 'root', status: 'passed' },
    ],
    ...traceOverrides,
  },
});

const verify = (receipt, overrides = {}) => verifyEvolutionTraceReceipt(receipt, {
  expectedCaseSha256: CASE_SHA256,
  expectedPolicy: POLICY,
  ...overrides,
});

test('trace verifier 只验证结构、绑定与完整性，不自报可评分', () => {
  const receipt = buildReceipt();
  const result = verify(receipt, { adapterVerifier: () => true });
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.completeness, { status: 'complete', reasons: [] });
  assert.equal(result.integrityEligible, true);
  assert.equal(result.adapterVerification, undefined);
  assert.equal(result.scoringEligible, false);
  assert.equal(hashEvolutionTraceValue({ stable: true }), 'f6ae9075446e89443e829410051dee7de57a5455d357a862a38f3208fbc1f6b5');
});

test('trace verifier 对 partial/unknown 与丢失计数 fail closed', () => {
  const partial = buildReceipt({
    capture: {
      status: 'complete', sampling: 'sampled', droppedEvents: 1,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'failed',
    },
  });
  const result = verify(partial);
  assert.deepEqual(result.failures, []);
  assert.equal(result.completeness.status, 'partial');
  assert.match(result.completeness.reasons.join('\n'), /sampling|droppedEvents|flushStatus/);
  assert.equal(result.scoringEligible, false);

  const unknown = buildReceipt({
    capture: {
      status: 'unknown', sampling: 'unknown', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'unknown',
    },
  });
  const unknownResult = verify(unknown);
  assert.deepEqual(unknownResult.failures, []);
  assert.equal(unknownResult.completeness.status, 'unknown');
});

test('trace verifier 拒绝原始内容、隐藏推理、tool payload 与凭据字段', () => {
  for (const forbidden of [
    { rawPrompt: '已脱敏' },
    { hiddenReasoning: '不应持久化' },
    { arguments: { query: 'value' } },
    { result: 'tool response' },
    { stdout: 'command output' },
    { environmentVariables: { HOME: '/tmp' } },
    { authorization: 'redacted' },
  ]) {
    const receipt = buildReceipt({ events: [
      { sequence: 1, type: 'session.start', actorId: 'root', ...forbidden },
      { sequence: 2, type: 'response.finish', actorId: 'root', sha256: 'f'.repeat(64), status: 'passed' },
      { sequence: 3, type: 'session.finish', actorId: 'root', status: 'passed' },
    ] });
    assert.notEqual(verify(receipt).failures.length, 0, Object.keys(forbidden)[0]);
  }
});

test('trace verifier 锁定序列、actor 生命周期、validation 和 revision 绑定', () => {
  const broken = buildReceipt();
  broken.trace.afterRevision = '1'.repeat(40);
  broken.trace.events[2].childActorId = 'root';
  broken.trace.events[3].sequence = 8;
  broken.trace.events[6].status = 'failed';
  const result = verify(broken);
  assert.match(result.failures.join('\n'), /afterRevision|sequence|childActorId|validation/);
  assert.equal(result.scoringEligible, false);
});

test('trace verifier 只允许 MCP 参数键和结果 schema 键，不保存正文', () => {
  const receipt = buildReceipt();
  receipt.trace.events.splice(2, 0,
    { type: 'mcp.call', actorId: 'root', operationId: 'mcp-one', name: 'ai-governance-scorecard', status: 'started', keys: ['top'] },
    { type: 'mcp.result', actorId: 'root', operationId: 'mcp-one', name: 'ai-governance-scorecard', status: 'passed', keys: ['maturityScorecard', 'nextFocus'] },
  );
  receipt.trace.events.forEach((event, index) => { event.sequence = index + 1; });
  assert.deepEqual(verify(receipt).failures, []);
  receipt.trace.events[2].keys = ['top', 'top'];
  assert.match(verify(receipt).failures.join('\n'), /keys/);
  receipt.trace.events[2].keys = ['top'];
  receipt.trace.events[3].name = 'ai-decision-summary';
  assert.match(verify(receipt).failures.join('\n'), /actor\/name/);
});

test('trace verifier 显式记录 command 与其它能力，不靠事件缺失证明未使用', () => {
  const receipt = buildReceipt();
  receipt.trace.events.splice(2, 0,
    { type: 'command.call', actorId: 'root', operationId: 'command-one', name: 'shell', status: 'started' },
    { type: 'command.result', actorId: 'root', operationId: 'command-one', name: 'shell', status: 'passed' },
    { type: 'capability.use', actorId: 'root', name: 'web_search', status: 'passed' },
  );
  receipt.trace.events.forEach((event, index) => { event.sequence = index + 1; });
  assert.deepEqual(verify(receipt).failures, []);
  receipt.trace.events[3].operationId = 'command-two';
  assert.match(verify(receipt).failures.join('\n'), /command operation/);
});

test('trace verifier 需要明确的 case/policy 绑定，任意 verifier 也不能提升评分', () => {
  const receipt = buildReceipt();
  assert.equal(verifyEvolutionTraceReceipt(receipt, { adapterVerifier: () => true }).scoringEligible, false);
  assert.equal(verify(receipt, { expectedCaseSha256: '0'.repeat(64), adapterVerifier: () => true }).scoringEligible, false);
  assert.equal(verify(receipt, { expectedPolicy: { ...POLICY, version: '2.0.0' }, adapterVerifier: () => true }).scoringEligible, false);
  assert.equal(verify(receipt).integrityEligible, true);
});
