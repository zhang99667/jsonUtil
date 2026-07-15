export const TRACE_POLICY_TEST_REVISION = 'a'.repeat(40);

export const buildTracePolicyMcpTrace = (events = []) => ({
  adapter: { id: 'codex-exec-jsonl', version: '1.2.1' },
  capture: {
    status: 'complete', sampling: 'all', droppedEvents: 0,
    droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
  },
  beforeRevision: TRACE_POLICY_TEST_REVISION,
  afterRevision: TRACE_POLICY_TEST_REVISION,
  events: [
    { type: 'session.start', actorId: 'root' },
    { type: 'mcp.call', actorId: 'root', operationId: 'mcp-1', name: 'jsonutils-governance/ai_governance_scorecard', status: 'started', keys: [] },
    { type: 'mcp.result', actorId: 'root', operationId: 'mcp-1', name: 'jsonutils-governance/ai_governance_scorecard', status: 'passed', keys: ['maturityScorecard.nextFocus.id'] },
    ...events,
    { type: 'response.finish', actorId: 'root', sha256: 'b'.repeat(64), status: 'passed' },
    { type: 'session.finish', actorId: 'root', status: 'passed' },
  ].map((event, index) => ({ sequence: index + 1, ...event })),
});

export const buildTracePolicySkillTrace = (policy, events = []) => ({
  adapter: { id: 'codex-exec-jsonl', version: '1.2.1' },
  capture: { status: 'complete', sampling: 'all', droppedEvents: 0,
    droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded' },
  beforeRevision: TRACE_POLICY_TEST_REVISION,
  afterRevision: TRACE_POLICY_TEST_REVISION,
  events: [
    { type: 'session.start', actorId: 'root' },
    { type: 'skill.decision', actorId: 'root', name: policy.requiredSkillDecision.name, status: 'selected' },
    ...policy.requiredReads.map(read => ({ type: 'context.read', actorId: 'root', ...read })),
    ...events,
    { type: 'response.finish', actorId: 'root', sha256: 'b'.repeat(64), status: 'passed' },
    { type: 'session.finish', actorId: 'root', status: 'passed' },
  ].map((event, index) => ({ sequence: index + 1, ...event })),
});
