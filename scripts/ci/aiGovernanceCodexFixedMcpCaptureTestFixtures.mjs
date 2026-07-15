export const buildFixedMcpCapture = (profile, { includeRequiredPath = true } = {}) => ({
  schemaVersion: 1,
  trace: {
    adapter: { id: 'codex-exec-jsonl', version: '1.2.0' },
    capture: {
      status: 'complete', sampling: 'all', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
    },
    events: [
      { sequence: 1, type: 'session.start', actorId: 'root' },
      { sequence: 2, type: 'mcp.call', actorId: 'root', operationId: 'fixture-op', name: 'jsonutils-governance/ai_governance_scorecard', status: 'started', keys: [] },
      { sequence: 3, type: 'mcp.result', actorId: 'root', operationId: 'fixture-op', name: 'jsonutils-governance/ai_governance_scorecard', status: 'passed', keys: includeRequiredPath ? ['maturityScorecard.nextFocus.id'] : [] },
      { sequence: 4, type: 'response.finish', actorId: 'root', sha256: 'b'.repeat(64), status: 'passed' },
      { sequence: 5, type: 'session.finish', actorId: 'root', status: 'passed' },
    ],
  },
  completeness: { status: 'complete', reasons: [] },
  executionFacts: {
    modelId: profile.modelId, cliVersion: '0.144.0-alpha.4', binarySha256: profile.binarySha256,
    stdoutSha256: 'c'.repeat(64), exitCode: 0, stdoutDrained: true, timedOut: false,
    binaryStable: true, componentDescriptorSha256: profile.componentDescriptorSha256,
    adapterBundleSha256: 'd'.repeat(64),
  },
  runnerFacts: {
    id: profile.id, version: profile.version, caseId: profile.caseId, modelId: profile.modelId,
    componentDescriptorSha256: profile.componentDescriptorSha256, adapterBundleStable: true,
  },
});
