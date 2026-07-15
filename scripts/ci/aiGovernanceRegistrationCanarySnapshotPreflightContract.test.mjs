import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  REGISTRATION_CANARY_SNAPSHOT_PREFLIGHT,
  REGISTRATION_CANARY_SNAPSHOT_STDERR_MAX_BYTES,
  assertRegistrationCanarySnapshotJsonRpcResult,
  createRegistrationCanarySnapshotStderrObserver,
  hashRegistrationCanarySnapshotValue,
  projectRegistrationCanarySnapshotScorecard,
  readRegistrationCanarySnapshotMcpConfig,
  registrationCanarySnapshotValuesEqual,
} from './aiGovernanceRegistrationCanarySnapshotContract.mjs';

const MCP_CONFIG_ERROR = 'snapshot preflight 只接受仓内固定 keyless stdio MCP 配置';
const SCORECARD_STATUS_ERROR = 'snapshot scorecard 状态或结果契约漂移';
const canonicalMcpConfig = () => ({
  mcpServers: {
    'jsonutils-governance': {
      command: 'node',
      args: ['scripts/mcp/jsonutils-governance-server.mjs'],
    },
  },
});

const withMcpConfig = (value, callback) => {
  const allocatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-snapshot-contract-'));
  const snapshotRoot = fs.realpathSync(allocatedRoot);
  try {
    const bytes = typeof value === 'string' ? value : JSON.stringify(value);
    fs.writeFileSync(path.join(snapshotRoot, '.mcp.json'), bytes, { mode: 0o400 });
    return callback(snapshotRoot);
  } finally {
    fs.rmSync(allocatedRoot, { recursive: true, force: true });
  }
};

const buildScorecard = ({ ok = true, nextFocusId = 'distribution-readiness' } = {}) => ({
  reportType: 'jsonutils-governance-scorecard',
  ok,
  maturityScorecard: {
    reportType: 'ai-governance-maturity-scorecard',
    nextFocus: { id: nextFocusId },
  },
  privateSummary: { payload: 'prompt-secret-must-not-leak' },
});

const buildCalled = (scorecard, options = {}) => ({
  isError: Object.hasOwn(options, 'isError') ? options.isError : !scorecard?.ok,
  content: [{
    type: 'text',
    text: Object.hasOwn(options, 'text') ? options.text : JSON.stringify(scorecard),
  }],
  structuredContent: Object.hasOwn(options, 'structuredContent')
    ? options.structuredContent : JSON.parse(JSON.stringify(scorecard)),
});
const expectError = (callback, message, name = 'Error') => (
  assert.throws(callback, { name, message })
);

test('snapshot contract 固定版本、域分离 hash 与稳定值顺序', () => {
  assert.deepEqual(REGISTRATION_CANARY_SNAPSHOT_PREFLIGHT, {
    id: 'mcp-registration-canary-snapshot-preflight',
    version: '1.1.0',
  });
  assert.ok(Object.isFrozen(REGISTRATION_CANARY_SNAPSHOT_PREFLIGHT));

  const value = { z: [{ b: 2, a: 1 }], a: 'fixed' };
  const expected = createHash('sha256')
    .update(JSON.stringify({ domain: 'domain-a', value })).digest('hex');
  assert.equal(hashRegistrationCanarySnapshotValue('domain-a', value), expected);
  assert.match(expected, /^[0-9a-f]{64}$/);
  assert.notEqual(
    hashRegistrationCanarySnapshotValue('domain-a', value),
    hashRegistrationCanarySnapshotValue('domain-b', value),
  );

  assert.equal(registrationCanarySnapshotValuesEqual(
    { z: [{ b: 2, a: 1 }], a: null },
    { a: null, z: [{ a: 1, b: 2 }] },
  ), true);
  assert.equal(registrationCanarySnapshotValuesEqual([{ a: 1 }, 2], [2, { a: 1 }]), false);
  assert.equal(registrationCanarySnapshotValuesEqual({ a: 1 }, [{ a: 1 }]), false);
});

test('snapshot scorecard 对 green/red 仅输出冻结的闭字段脱敏投影', () => {
  for (const ok of [true, false]) {
    const scorecard = buildScorecard({ ok });
    const called = buildCalled(scorecard, {
      structuredContent: {
        privateSummary: { payload: scorecard.privateSummary.payload },
        maturityScorecard: {
          nextFocus: { id: scorecard.maturityScorecard.nextFocus.id },
          reportType: scorecard.maturityScorecard.reportType,
        },
        ok,
        reportType: scorecard.reportType,
      },
    });
    const projected = projectRegistrationCanarySnapshotScorecard(called);
    assert.deepEqual(Object.keys(projected), [
      'scorecardOk', 'isError', 'reportType', 'maturityReportType',
      'nextFocusIdSha256', 'resultSha256',
    ]);
    assert.deepEqual(projected, {
      scorecardOk: ok,
      isError: !ok,
      reportType: 'jsonutils-governance-scorecard',
      maturityReportType: 'ai-governance-maturity-scorecard',
      nextFocusIdSha256: hashRegistrationCanarySnapshotValue(
        'jsonutils.registration-snapshot.next-focus/v1', 'distribution-readiness',
      ),
      resultSha256: hashRegistrationCanarySnapshotValue(
        'jsonutils.registration-snapshot.scorecard-result/v1', scorecard,
      ),
    });
    assert.ok(Object.isFrozen(projected));
    assert.doesNotMatch(JSON.stringify(projected), /prompt-secret|distribution-readiness/);
  }
});

test('snapshot scorecard 拒绝非闭合 envelope 与非 JSON text', () => {
  const valid = buildCalled(buildScorecard());
  for (const called of [
    null,
    { ...valid, isError: 'false' },
    { ...valid, content: null },
    { ...valid, content: [] },
    { ...valid, content: [valid.content[0], valid.content[0]] },
    { ...valid, content: [null] },
    { ...valid, content: [{ type: 'json', text: '{}' }] },
  ]) {
    expectError(
      () => projectRegistrationCanarySnapshotScorecard(called),
      'snapshot scorecard 返回错误或非闭合 text result',
    );
  }
  expectError(
    () => projectRegistrationCanarySnapshotScorecard({
      ...valid, content: [{ type: 'text', text: '{broken' }],
    }),
    'snapshot scorecard text 不是合法 JSON',
  );
});

test('snapshot scorecard 拒绝 text/structuredContent 不一致或形状非法', () => {
  const scorecard = buildScorecard();
  for (const structuredContent of [null, [], { ...scorecard, ok: false }]) {
    expectError(
      () => projectRegistrationCanarySnapshotScorecard(buildCalled(scorecard, { structuredContent })),
      'snapshot scorecard text 与 structuredContent 不一致',
    );
  }
});

test('snapshot scorecard 锁定 report/status/maturity/nextFocus 边界', () => {
  const cases = [
    scorecard => { scorecard.reportType = 'other-report'; },
    scorecard => { scorecard.ok = 'true'; },
    scorecard => { scorecard.maturityScorecard = null; },
    scorecard => { scorecard.maturityScorecard.reportType = 'other-maturity'; },
    scorecard => { scorecard.maturityScorecard.nextFocus.id = null; },
    scorecard => { scorecard.maturityScorecard.nextFocus.id = ''; },
    scorecard => { scorecard.maturityScorecard.nextFocus.id = 'x'.repeat(129); },
  ];
  for (const mutate of cases) {
    const scorecard = buildScorecard();
    mutate(scorecard);
    expectError(
      () => projectRegistrationCanarySnapshotScorecard(buildCalled(scorecard)),
      SCORECARD_STATUS_ERROR,
    );
  }
  const scorecard = buildScorecard();
  expectError(
    () => projectRegistrationCanarySnapshotScorecard(buildCalled(scorecard, { isError: true })),
    SCORECARD_STATUS_ERROR,
  );
});

test('snapshot JSON-RPC projector 仅接受 result 且不泄露 error 正文', () => {
  const result = { ok: true };
  assert.strictEqual(assertRegistrationCanarySnapshotJsonRpcResult({ result }, 'initialize'), result);
  for (const response of [null, [], {}, { result, error: 'private-error-body' }]) {
    expectError(
      () => assertRegistrationCanarySnapshotJsonRpcResult(response, 'initialize'),
      'initialize 返回 JSON-RPC error',
    );
  }
});

test('snapshot MCP config 仅接受 canonical 普通文件闭字段配置', () => {
  withMcpConfig(canonicalMcpConfig(), (snapshotRoot) => {
    assert.equal(fs.realpathSync(snapshotRoot), snapshotRoot);
    const config = readRegistrationCanarySnapshotMcpConfig(snapshotRoot);
    assert.deepEqual(config, {
      command: 'node',
      args: ['scripts/mcp/jsonutils-governance-server.mjs'],
    });
    assert.ok(Object.isFrozen(config));
    assert.ok(Object.isFrozen(config.args));
  });
});

test('snapshot MCP config 对 malformed/null 与所有额外字段 fail closed', () => {
  const invalidConfigs = [
    '{broken',
    'null',
    { ...canonicalMcpConfig(), extra: true },
    {
      mcpServers: {
        ...canonicalMcpConfig().mcpServers,
        other: { command: 'node', args: [] },
      },
    },
    {
      mcpServers: {
        'jsonutils-governance': {
          ...canonicalMcpConfig().mcpServers['jsonutils-governance'],
          env: {},
        },
      },
    },
    {
      mcpServers: {
        'jsonutils-governance': { command: 'bash', args: ['scripts/mcp/jsonutils-governance-server.mjs'] },
      },
    },
    {
      mcpServers: {
        'jsonutils-governance': { command: 'node', args: [] },
      },
    },
  ];
  for (const config of invalidConfigs) {
    withMcpConfig(config, (snapshotRoot) => {
      expectError(
        () => readRegistrationCanarySnapshotMcpConfig(snapshotRoot),
        MCP_CONFIG_ERROR,
      );
    });
  }
});

test('snapshot stderr observer 统计 Buffer/string 并接受精确上限', () => {
  assert.equal(REGISTRATION_CANARY_SNAPSHOT_STDERR_MAX_BYTES, 16 * 1024);
  const empty = createRegistrationCanarySnapshotStderrObserver().result();
  assert.deepEqual(empty, { byteCount: 0, nonEmpty: false });
  assert.ok(Object.isFrozen(empty));

  let limitSignals = 0;
  const observer = createRegistrationCanarySnapshotStderrObserver({
    maxBytes: 5,
    onLimitExceeded: () => { limitSignals += 1; },
  });
  observer.observe(Buffer.from('ab'));
  observer.observe('é');
  observer.observe('x');
  const result = observer.result();
  assert.deepEqual(result, { byteCount: 5, nonEmpty: true });
  assert.ok(Object.isFrozen(result));
  assert.equal(limitSignals, 0);
});

test('snapshot stderr observer 超限立即且仅回调一次并返回无正文错误', () => {
  let limitSignals = 0;
  const observer = createRegistrationCanarySnapshotStderrObserver({
    maxBytes: 4,
    onLimitExceeded: () => { limitSignals += 1; },
  });
  observer.observe('secret-body');
  observer.observe(Buffer.from('ignored-body'));
  assert.equal(limitSignals, 1);
  expectError(
    () => observer.result(),
    'snapshot MCP stderr 超出固定上限',
  );

  const defaultObserver = createRegistrationCanarySnapshotStderrObserver();
  defaultObserver.observe(Buffer.alloc(REGISTRATION_CANARY_SNAPSHOT_STDERR_MAX_BYTES + 1));
  expectError(
    () => defaultObserver.result(),
    'snapshot MCP stderr 超出固定上限',
  );
});

test('snapshot stderr observer 拒绝非法参数与 chunk 类型', () => {
  for (const options of [
    { maxBytes: 1.5 },
    { maxBytes: 0 },
    { maxBytes: Number.MAX_SAFE_INTEGER },
    { maxBytes: 1, onLimitExceeded: null },
  ]) {
    expectError(
      () => createRegistrationCanarySnapshotStderrObserver(options),
      'snapshot MCP stderr observer 参数非法',
      'TypeError',
    );
  }
  const observer = createRegistrationCanarySnapshotStderrObserver({ maxBytes: 1 });
  expectError(
    () => observer.observe({ body: 'private' }),
    'snapshot MCP stderr chunk 类型非法',
    'TypeError',
  );
});
