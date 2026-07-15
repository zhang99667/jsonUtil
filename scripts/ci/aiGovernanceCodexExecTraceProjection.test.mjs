import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CODEX_EXEC_MAX_JSONL_LINE_BYTES } from './aiGovernanceCodexExecJsonlFraming.mjs';
import { createCodexExecJsonlProjector } from './aiGovernanceCodexExecTraceProjection.mjs';

const projectChunks = (chunks, { projectorOptions, execution = {} } = {}) => {
  const projector = createCodexExecJsonlProjector('0.132.0', projectorOptions);
  for (const chunk of chunks) projector.push(chunk);
  return projector.finalize({
    exitCode: 0,
    stdoutDrained: true,
    timedOut: false,
    binaryStable: true,
    ...execution,
  });
};

const projectEvents = (events, options) => projectChunks([
  Buffer.from(events.map(event => `${JSON.stringify(event)}\n`).join('')),
], options);

const lifecycleChunks = () => [
  Buffer.from('{"type":"thread.started"}\n{"type":"turn.started"}\n'),
  Buffer.from('{"type":"item.completed","item":{"id":"message-1","type":"agent_message","text":"ok"}}\n{"type":"turn.completed"}\n'),
];

test('完整到达的超长 JSONL 行同样受单行上限约束，并可继续处理下一行', () => {
  const [start, finish] = lifecycleChunks();
  const prefix = '{"type":"thread.started","padding":"';
  const suffix = '"}\n';
  const oversizedLine = Buffer.from(
    `${prefix}${'x'.repeat(CODEX_EXEC_MAX_JSONL_LINE_BYTES + 1)}${suffix}`,
  );

  const report = projectChunks([start, oversizedLine, finish]);

  assert.equal(report.completeness.status, 'partial');
  assert.ok(report.completeness.reasons.includes('dropped-events'));
  assert.equal(report.completeness.reasons.includes('malformed-jsonl'), false);
  assert.equal(report.trace.capture.droppedEvents, 1);
  assert.deepEqual(report.trace.events.map(event => event.type), [
    'session.start', 'response.finish', 'session.finish',
  ]);
});

test('MCP allowlist 只投影已存在键，并对名称、参数与 operation metadata fail closed', () => {
  const report = projectEvents([
    { type: 'thread.started' },
    { type: 'turn.started' },
    { type: 'item.started', item: {
      id: 'mcp-1', type: 'mcp_tool_call', server: 'safe', tool: 'tool', arguments: '{bad}',
    } },
    { type: 'item.completed', item: {
      id: 'mcp-1', type: 'mcp_tool_call', server: 'safe', tool: 'other',
      result: JSON.stringify({ structuredContent: { result: { deep: 'SECRET' } } }),
    } },
    { type: 'item.started', item: {
      id: 'mcp-2', type: 'mcp_tool_call', server: 'unsafe/name', tool: 'tool', arguments: {},
    } },
    { type: 'item.completed', item: {
      id: 'mcp-2', type: 'mcp_tool_call', server: 'safe', tool: 'tool', result: {},
    } },
    { type: 'item.completed', item: { id: 'message-1', type: 'agent_message', text: 'ok' } },
    { type: 'turn.completed' },
  ], { projectorOptions: { mcpResultKeyAllowlist: {
    'safe/other': ['result.deep', 'result.missing'],
  } } });

  assert.ok(report.completeness.reasons.includes('unsafe-mcp-keys'));
  assert.ok(report.completeness.reasons.includes('operation-metadata-mismatch'));
  assert.ok(report.completeness.reasons.includes('unsafe-mcp-name'));
  assert.ok(report.completeness.reasons.includes('missing-required-mcp-result-key'));
  assert.equal(report.trace.capture.droppedAttributes, 3);
  assert.equal(report.trace.capture.droppedLinks, 1);
  assert.deepEqual(report.trace.events.filter(event => event.type.startsWith('mcp.')).map(event => ({
    type: event.type, name: event.name, keys: event.keys,
  })), [
    { type: 'mcp.call', name: 'safe/tool', keys: [] },
    { type: 'mcp.result', name: 'safe/other', keys: ['result.deep'] },
  ]);
  assert.equal(JSON.stringify(report).includes('SECRET'), false);
});

test('item update、重复、类型漂移和非 operation 未闭合都有稳定原因', () => {
  const report = projectEvents([
    { type: 'thread.started' },
    { type: 'turn.started' },
    { type: 'item.updated', item: { id: 'orphan', type: 'reasoning' } },
    { type: 'item.started', item: { id: 'same', type: 'reasoning' } },
    { type: 'item.started', item: { id: 'same', type: 'reasoning' } },
    { type: 'item.completed', item: { id: 'same', type: 'agent_message', text: 'ok' } },
    { type: 'item.completed', item: { id: 'same', type: 'agent_message', text: 'ok' } },
    { type: 'item.started', item: { id: 'unfinished', type: 'reasoning' } },
    { type: 'turn.completed' },
  ]);

  for (const reason of [
    'item-update-without-start', 'duplicate-item-start', 'operation-type-mismatch',
    'duplicate-item-completion', 'item-completion-missing',
  ]) assert.ok(report.completeness.reasons.includes(reason), reason);
});

test('外部终结事实逐项缺失时保持 partial，顶层 error 使 session 失败', () => {
  const base = lifecycleChunks();
  for (const [field, value, reason] of [
    ['stdoutDrained', false, 'stdout-not-drained'],
    ['timedOut', true, 'execution-timeout'],
    ['binaryStable', false, 'binary-changed-during-capture'],
    ['outputLimitExceeded', true, 'output-limit-exceeded'],
  ]) {
    const report = projectChunks(base, { execution: { [field]: value } });
    assert.ok(report.completeness.reasons.includes(reason), reason);
  }

  const failed = projectEvents([
    { type: 'thread.started' },
    { type: 'turn.started' },
    { type: 'error', message: 'SECRET' },
    { type: 'item.completed', item: { id: 'message-1', type: 'agent_message', text: 'ok' } },
    { type: 'turn.completed' },
  ]);
  assert.ok(failed.completeness.reasons.includes('codex-error-event'));
  assert.equal(failed.trace.events.at(-1).status, 'failed');
  assert.equal(JSON.stringify(failed).includes('SECRET'), false);
});

test('trace 事件上限为最终 response/session 保留两个槽位', () => {
  const capabilities = Array.from({ length: 205 }, (_, index) => ({
    type: 'item.completed', item: { id: `web-${index}`, type: 'web_search' },
  }));
  const report = projectEvents([
    { type: 'thread.started' },
    { type: 'turn.started' },
    ...capabilities,
    { type: 'item.completed', item: { id: 'message-1', type: 'agent_message', text: 'ok' } },
    { type: 'turn.completed' },
  ]);

  assert.equal(report.trace.events.length, 200);
  assert.deepEqual(report.trace.events.slice(-2).map(event => event.type), [
    'response.finish', 'session.finish',
  ]);
  assert.ok(report.completeness.reasons.includes('dropped-events'));
  assert.equal(report.trace.capture.droppedEvents, 8);
});
