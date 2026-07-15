import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildEvolutionTracePolicyRegistry,
  verifyEvolutionTracePolicy,
} from './aiGovernanceEvolutionTracePolicies.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const revision = 'a'.repeat(40);

const buildTrace = (events = []) => ({
  adapter: { id: 'codex-exec-jsonl', version: '1.2.0' },
  capture: {
    status: 'complete', sampling: 'all', droppedEvents: 0,
    droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
  },
  beforeRevision: revision,
  afterRevision: revision,
  events: [
    { type: 'session.start', actorId: 'root' },
    { type: 'mcp.call', actorId: 'root', operationId: 'mcp-1', name: 'jsonutils-governance/ai_governance_scorecard', status: 'started', keys: [] },
    { type: 'mcp.result', actorId: 'root', operationId: 'mcp-1', name: 'jsonutils-governance/ai_governance_scorecard', status: 'passed', keys: ['maturityScorecard.nextFocus.id'] },
    ...events,
    { type: 'response.finish', actorId: 'root', sha256: 'b'.repeat(64), status: 'passed' },
    { type: 'session.finish', actorId: 'root', status: 'passed' },
  ].map((event, index) => ({ sequence: index + 1, ...event })),
});

test('固定 trace policy 绑定 case、adapter 与稳定 digest', () => {
  const registry = buildEvolutionTracePolicyRegistry({ rootDir });
  assert.deepEqual(registry.failures, []);
  assert.equal(registry.policiesByCaseId.size, 2);
  assert.deepEqual(registry.policiesByCaseId.get('mcp-project-registration-discovery').descriptor, {
    id: 'mcp-project-registration-discovery', version: '1.0.0',
    sha256: '83e48699903353bba3e62da7d10e6b66722194db21eb16e5803247befec40af4',
  });
  const entry = registry.policiesByCaseId.get('mcp-fixed-tool-selection');
  assert.deepEqual(entry.descriptor, {
    id: 'mcp-fixed-tool-selection',
    version: '1.1.0',
    sha256: '2442be94dce53531e78963b515c2cacd1030ec4ac27cd14ffa20071e3733c472',
  });
  assert.deepEqual(entry.verify(buildTrace()), { status: 'verified', failures: [] });
});

test('固定 trace policy 拒绝额外能力、错误工具、缺结果键和 revision 漂移', () => {
  const registry = buildEvolutionTracePolicyRegistry({ rootDir });
  const { policy } = registry.policiesByCaseId.get('mcp-fixed-tool-selection');
  for (const mutate of [
    trace => trace.events.splice(-2, 0, { sequence: 4, type: 'command.call', actorId: 'root', operationId: 'command-1', name: 'shell', status: 'started' }),
    trace => { trace.events[1].name = trace.events[2].name = 'other/tool'; },
    trace => { trace.events[2].keys = ['maturityScorecard']; },
    trace => { trace.afterRevision = 'c'.repeat(40); },
    trace => { trace.capture.status = 'partial'; },
  ]) {
    const trace = buildTrace();
    mutate(trace);
    assert.equal(verifyEvolutionTracePolicy({ trace, policy }).status, 'rejected');
  }
});

test('固定 trace policy 不接受额外 MCP，即使目标调用也存在', () => {
  const registry = buildEvolutionTracePolicyRegistry({ rootDir });
  const { policy } = registry.policiesByCaseId.get('mcp-fixed-tool-selection');
  const trace = buildTrace([
    { type: 'mcp.call', actorId: 'root', operationId: 'mcp-2', name: 'jsonutils-governance/ai_decision_summary', status: 'started', keys: [] },
    { type: 'mcp.result', actorId: 'root', operationId: 'mcp-2', name: 'jsonutils-governance/ai_decision_summary', status: 'passed', keys: ['decisions'] },
  ]);
  assert.match(verifyEvolutionTracePolicy({ trace, policy }).failures.join('\n'), /唯一 MCP/);
});
