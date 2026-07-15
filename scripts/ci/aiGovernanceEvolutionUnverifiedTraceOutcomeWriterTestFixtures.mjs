export const UNVERIFIED_TRACE_CASE_ID = 'mcp-fixed-tool-selection';
export const UNVERIFIED_TRACE_EVALUATED_AT = '2026-07-15';
export const UNVERIFIED_TRACE_REVISION = `worktree-${'a'.repeat(64)}`;

export const buildUnverifiedTraceObservation = (overrides = {}) => ({
  schemaVersion: 1,
  artifactType: 'ai-evolution-unverified-trace-observation',
  dataClass: 'redacted',
  caseId: UNVERIFIED_TRACE_CASE_ID,
  method: 'model',
  trace: {
    adapter: { id: 'codex-exec-jsonl', version: '1.2.1' },
    capture: {
      status: 'complete', sampling: 'all', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
    },
    events: [
      { sequence: 1, type: 'session.start', actorId: 'root' },
      {
        sequence: 2, type: 'mcp.call', actorId: 'root', operationId: 'scorecard',
        name: 'jsonutils-governance/ai_governance_scorecard', status: 'started',
      },
      {
        sequence: 3, type: 'mcp.result', actorId: 'root', operationId: 'scorecard',
        name: 'jsonutils-governance/ai_governance_scorecard', status: 'passed',
        keys: ['maturityScorecard.nextFocus.id'],
      },
      { sequence: 4, type: 'response.finish', actorId: 'root', sha256: 'b'.repeat(64), status: 'passed' },
      { sequence: 5, type: 'session.finish', actorId: 'root', status: 'passed' },
    ],
  },
  ...overrides,
});
