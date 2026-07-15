import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  CODEX_EXEC_TRACE_ADAPTER,
  projectCodexExecJsonlTrace,
} from './aiGovernanceCodexExecTraceAdapter.mjs';
import { collectReachableFiles } from './aiGovernanceLocalImportGraph.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const baseEvents = ({ responseText = 'component reply' } = {}) => [
  { type: 'thread.started', thread_id: 'thread-component-only' },
  { type: 'turn.started' },
  { type: 'item.completed', item: { id: 'reasoning-1', type: 'reasoning', text: 'not retained' } },
  { type: 'item.completed', item: { id: 'message-1', type: 'agent_message', text: responseText } },
  { type: 'turn.completed', usage: { input_tokens: 1, output_tokens: 1 } },
];

const createFixture = async (_t, {
  version = '0.132.0',
  events = baseEvents(),
  rawTail = '',
  exitCode = 0,
} = {}) => ({
  cliVersion: version,
  jsonlChunks: [...events.map(event => `${JSON.stringify(event)}\n`), rawTail].filter(Boolean),
  reportedExecution: {
    exitCode, stdoutDrained: true, timedOut: false, binaryStable: true,
  },
});

const capture = (fixture, overrides = {}) => projectCodexExecJsonlTrace({
  ...fixture,
  ...overrides,
});

test('生产 adapter 的完整投影闭包不导入进程执行或用户认证路径', async () => {
  const files = [...collectReachableFiles(rootDir, [
    'scripts/ci/aiGovernanceCodexExecTraceAdapter.mjs',
  ])].sort();
  assert.ok(files.includes('scripts/ci/aiGovernanceCodexExecJsonlFraming.mjs'));
  assert.ok(files.includes('scripts/ci/aiGovernanceCodexExecTraceProjection.mjs'));
  for (const file of files) {
    const source = await readFile(path.join(rootDir, file), 'utf8');
    for (const forbidden of [
      'node:child_process', 'captureCodexExecTrace', 'runCodexExecJsonlCapture', 'CODEX_HOME',
    ]) assert.equal(source.includes(forbidden), false, `${file}: ${forbidden}`);
  }
});

test('纯 JSONL projector 产出完整脱敏 trace，并明确外部事实未验信', async (t) => {
  const fixture = await createFixture(t, {
    events: [
      { type: 'thread.started', thread_id: 'SECRET_THREAD' },
      { type: 'turn.started' },
      {
        type: 'item.started',
        item: {
          id: 'mcp-1', type: 'mcp_tool_call', server: 'jsonutils-governance',
          tool: 'ai_decision_summary', arguments: { top: 5, token: 'SECRET_TOKEN' },
        },
      },
      {
        type: 'item.completed',
        item: {
          id: 'mcp-1', type: 'mcp_tool_call', server: 'jsonutils-governance',
          tool: 'ai_decision_summary', result: { decisions: [], authorization: 'SECRET_AUTH' },
        },
      },
      {
        type: 'item.started',
        item: { id: 'command-1', type: 'command_execution', command: 'SECRET_COMMAND' },
      },
      {
        type: 'item.completed',
        item: {
          id: 'command-1', type: 'command_execution', command: 'SECRET_COMMAND',
          aggregated_output: 'SECRET_STDOUT', exit_code: 0,
        },
      },
      { type: 'item.completed', item: { id: 'reasoning-1', type: 'reasoning', text: 'SECRET_REASONING' } },
      { type: 'item.completed', item: { id: 'message-1', type: 'agent_message', text: 'SECRET_FINAL_MESSAGE' } },
      { type: 'turn.completed' },
    ],
  });

  const result = await capture(fixture);
  assert.deepEqual(result.trace.adapter, CODEX_EXEC_TRACE_ADAPTER);
  assert.equal(result.completeness.status, 'complete');
  assert.deepEqual(result.completeness.reasons, []);
  assert.deepEqual(result.trace.capture, {
    status: 'complete', sampling: 'all', droppedEvents: 0,
    droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
  });
  assert.equal(result.executionFacts.cliVersion, '0.132.0');
  assert.match(result.executionFacts.stdoutSha256, /^[0-9a-f]{64}$/);
  assert.equal(result.executionFacts.origin, 'externally-reported-unverified');
  assert.equal(result.executionFacts.exitCode, 0);
  assert.equal(result.executionFacts.stdoutDrained, true);
  assert.deepEqual(result.trace.events.map(event => event.type), [
    'session.start', 'mcp.call', 'mcp.result', 'command.call', 'command.result',
    'response.finish', 'session.finish',
  ]);
  assert.deepEqual(result.trace.events[1].keys, ['token', 'top']);
  assert.deepEqual(result.trace.events[2].keys, ['authorization', 'decisions']);
  assert.equal(result.trace.events[3].name, 'shell');
  assert.equal(result.trace.events[4].name, 'shell');
  assert.match(result.trace.events[5].sha256, /^[0-9a-f]{64}$/);

  const serialized = JSON.stringify(result);
  for (const forbidden of [
    'COMPONENT_ONLY_PROMPT', 'SECRET_THREAD', 'SECRET_TOKEN', 'SECRET_AUTH',
    'SECRET_COMMAND', 'SECRET_STDOUT', 'SECRET_REASONING', 'SECRET_FINAL_MESSAGE',
    'STDERR_BODY_MUST_NOT_BE_RETAINED',
  ]) assert.equal(serialized.includes(forbidden), false, forbidden);
});

test('0.132.0 与 0.144.0-alpha.4 共用同一个 parser，未知版本降级 partial', async (t) => {
  for (const version of ['0.132.0', '0.144.0-alpha.4']) {
    const result = await capture(await createFixture(t, { version }));
    assert.equal(result.completeness.status, 'complete', version);
    assert.equal(result.executionFacts.cliVersion, version);
  }
  const unknown = await capture(await createFixture(t, { version: '9.9.9' }));
  assert.equal(unknown.completeness.status, 'partial');
  assert.ok(unknown.completeness.reasons.includes('unsupported-cli-version'));
});

test('web_search 和 collab_tool_call 只投影固定 capability.use', async (t) => {
  const result = await capture(await createFixture(t, {
    events: [
      { type: 'thread.started', thread_id: 'thread-component-only' },
      { type: 'turn.started' },
      { type: 'item.started', item: { id: 'web-1', type: 'web_search', query: 'SECRET_QUERY' } },
      { type: 'item.completed', item: { id: 'web-1', type: 'web_search', query: 'SECRET_QUERY' } },
      { type: 'item.started', item: { id: 'collab-1', type: 'collab_tool_call', action: 'SECRET_ACTION' } },
      {
        type: 'item.completed',
        item: { id: 'collab-1', type: 'collab_tool_call', action: 'SECRET_ACTION', error: 'SECRET_ERROR' },
      },
      { type: 'item.completed', item: { id: 'message-1', type: 'agent_message', text: 'component reply' } },
      { type: 'turn.completed' },
    ],
  }));

  assert.equal(result.completeness.status, 'complete');
  assert.deepEqual(result.trace.events.filter(event => event.type === 'capability.use'), [
    { sequence: 2, type: 'capability.use', actorId: 'root', name: 'web_search', status: 'passed' },
    { sequence: 3, type: 'capability.use', actorId: 'root', name: 'collaboration', status: 'failed' },
  ]);
  assert.equal(JSON.stringify(result).includes('SECRET_QUERY'), false);
  assert.equal(JSON.stringify(result).includes('SECRET_ACTION'), false);
  assert.equal(JSON.stringify(result).includes('SECRET_ERROR'), false);
});

test('MCP 结构化结果只递归投影安全键路径，不泄漏正文', async (t) => {
  const events = [
    { type: 'thread.started', thread_id: 'thread-component-only' },
    { type: 'turn.started' },
    {
      type: 'item.started',
      item: {
        id: 'mcp-nested', type: 'mcp_tool_call', server: 'jsonutils-governance',
        tool: 'ai_governance_scorecard', arguments: { top: 5 },
      },
    },
    {
      type: 'item.completed',
      item: {
        id: 'mcp-nested', type: 'mcp_tool_call', server: 'jsonutils-governance',
        tool: 'ai_governance_scorecard',
        result: {
          structured_content: {
            maturityScorecard: { nextFocus: 'SECRET_NEXT_FOCUS', score: 88 },
            evidence: ['SECRET_EVIDENCE'],
          },
          content: [{ text: 'SECRET_FALLBACK_BODY' }],
        },
      },
    },
    { type: 'item.completed', item: { id: 'message-1', type: 'agent_message', text: 'component reply' } },
    { type: 'turn.completed' },
  ];
  const result = await capture(await createFixture(t, { events }));
  assert.equal(result.completeness.status, 'complete');
  assert.deepEqual(result.trace.events.find(event => event.type === 'mcp.result').keys, [
    'evidence', 'maturityScorecard.nextFocus', 'maturityScorecard.score',
  ]);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes('SECRET_NEXT_FOCUS'), false);
  assert.equal(serialized.includes('SECRET_EVIDENCE'), false);
  assert.equal(serialized.includes('SECRET_FALLBACK_BODY'), false);

  events[3].item.result = { structured_content: { level1: { level2: { level3: { tooDeep: 'SECRET' } } } } };
  const tooDeep = await capture(await createFixture(t, { events }));
  assert.equal(tooDeep.completeness.status, 'partial');
  assert.ok(tooDeep.completeness.reasons.includes('unsafe-mcp-keys'));
  assert.ok(tooDeep.trace.capture.droppedAttributes > 0);
  assert.equal(JSON.stringify(tooDeep).includes('tooDeep'), false);
});

test('未知事件、未知 item、坏 JSON 和截断 JSONL 都 fail closed', async (t) => {
  const cases = [
    {
      name: 'unknown-event-type',
      events: [...baseEvents().slice(0, 2), { type: 'future.event' }, ...baseEvents().slice(2)],
    },
    {
      name: 'unknown-item-type',
      events: [
        ...baseEvents().slice(0, 2),
        { type: 'item.completed', item: { id: 'future-1', type: 'future_item', payload: 'SECRET' } },
        ...baseEvents().slice(2),
      ],
    },
    { name: 'malformed-jsonl', events: baseEvents(), rawTail: '{bad json}\n' },
    { name: 'truncated-jsonl', events: baseEvents(), rawTail: '{"type":"error"' },
  ];

  for (const item of cases) {
    const result = await capture(await createFixture(t, item));
    assert.equal(result.completeness.status, 'partial', item.name);
    assert.ok(result.completeness.reasons.includes(item.name), item.name);
    assert.ok(result.trace.capture.droppedEvents > 0, item.name);
  }
});

test('重复或缺失 lifecycle 与 operation 配对均为 partial', async (t) => {
  const scenarios = [
    {
      reason: 'duplicate-thread-started',
      events: [baseEvents()[0], baseEvents()[0], ...baseEvents().slice(1)],
    },
    {
      reason: 'missing-turn-started',
      events: [baseEvents()[0], ...baseEvents().slice(2)],
    },
    {
      reason: 'missing-turn-terminal',
      events: baseEvents().slice(0, -1),
    },
    {
      reason: 'operation-completion-missing',
      events: [
        ...baseEvents().slice(0, 2),
        { type: 'item.started', item: { id: 'command-1', type: 'command_execution', command: 'discarded' } },
        ...baseEvents().slice(2),
      ],
    },
    {
      reason: 'operation-start-missing',
      events: [
        ...baseEvents().slice(0, 2),
        { type: 'item.completed', item: { id: 'mcp-1', type: 'mcp_tool_call', server: 'safe', tool: 'safe' } },
        ...baseEvents().slice(2),
      ],
    },
  ];

  for (const scenario of scenarios) {
    const result = await capture(await createFixture(t, scenario));
    assert.equal(result.completeness.status, 'partial', scenario.reason);
    assert.ok(result.completeness.reasons.includes(scenario.reason), scenario.reason);
  }
});

test('file_change、turn.failed 和非零退出都不会被伪造成 complete', async (t) => {
  const fileChange = await capture(await createFixture(t, {
    events: [
      ...baseEvents().slice(0, 2),
      { type: 'item.started', item: { id: 'file-1', type: 'file_change', changes: ['SECRET_PATCH'] } },
      { type: 'item.completed', item: { id: 'file-1', type: 'file_change', changes: ['SECRET_PATCH'] } },
      ...baseEvents().slice(2),
    ],
  }));
  assert.equal(fileChange.completeness.status, 'partial');
  assert.ok(fileChange.completeness.reasons.includes('file-change-unverifiable'));
  assert.equal(fileChange.trace.events.some(event => event.type === 'file.change'), false);
  assert.equal(JSON.stringify(fileChange).includes('SECRET_PATCH'), false);

  const lagEvents = baseEvents();
  lagEvents.splice(-1, 0, { type: 'item.completed', item: {
    id: 'lag-1', type: 'error', message: 'in-process app-server event stream lagged; dropped 7 events',
  } });
  const lag = await capture(await createFixture(t, { events: lagEvents }));
  assert.equal(lag.trace.capture.droppedEvents, 7);
  assert.ok(lag.completeness.reasons.includes('stream-lag'));
  lagEvents.at(-2).item.message = 'SECRET_ORDINARY_ERROR';
  const ordinaryError = await capture(await createFixture(t, { events: lagEvents }));
  assert.ok(ordinaryError.completeness.reasons.includes('codex-error-item'));
  assert.equal(JSON.stringify(ordinaryError).includes('SECRET_ORDINARY_ERROR'), false);

  const failedEvents = baseEvents();
  failedEvents[failedEvents.length - 1] = { type: 'turn.failed', error: 'SECRET_FAILURE' };
  const failed = await capture(await createFixture(t, { events: failedEvents }));
  assert.equal(failed.completeness.status, 'partial');
  assert.ok(failed.completeness.reasons.includes('turn-failed'));
  assert.equal(failed.trace.events.at(-1).status, 'failed');

  const nonzero = await capture(await createFixture(t, { exitCode: 7 }));
  assert.equal(nonzero.completeness.status, 'partial');
  assert.ok(nonzero.completeness.reasons.includes('nonzero-exit'));
  assert.equal(nonzero.executionFacts.exitCode, 7);
});

test('拒绝缺少或伪造外部执行事实，组件 fixture 不代表可信 outcome', async () => {
  await assert.rejects(
    async () => projectCodexExecJsonlTrace({ cliVersion: '0.144.0-alpha.4', jsonlChunks: [] }),
    /jsonlChunks 必须是非空数组/,
  );
  await assert.rejects(
    async () => projectCodexExecJsonlTrace({
      cliVersion: '0.144.0-alpha.4', jsonlChunks: ['{}\n'], reportedExecution: {},
    }),
    /reportedExecution 必须显式提供/,
  );
  await assert.rejects(
    async () => projectCodexExecJsonlTrace({
      cliVersion: '0.144.0-alpha.4', jsonlChunks: [{}],
      reportedExecution: { exitCode: 0, stdoutDrained: true, timedOut: false, binaryStable: true },
    }),
    /jsonlChunks 只能包含/,
  );
});
