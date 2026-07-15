import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceArtifactSummary } from './writeAiGovernanceArtifactSummary.mjs';
import { AI_GOVERNANCE_ARTIFACT_GENERATED_AT } from './writeAiGovernanceArtifactTestFixtures.mjs';

test('build AI governance artifact summary with maturity focus and latest decision', () => {
  const summary = buildAiGovernanceArtifactSummary({
    project: {
      name: 'json-helper-ai-fix',
      version: '1.8.736',
      latestDecision: { date: '2026-07-10', decision: '固化 CI 治理 JSON 产物' },
    },
    governance: { ok: true },
    evolution: { counts: { coveredCases: 2, cases: 16, behaviorCases: 13, componentBoundaryCases: 3, openFeedbackSignals: 1, experiments: 1, plannedExperimentTrials: 6 } },
    maintainability: {
      ok: true,
      highUsage: [{ file: 'scripts/ci/aiGovernanceTiny.mjs' }],
    },
    maturityScorecard: {
      score: 88,
      status: 'warn',
      nextFocus: { nextAction: '优先拆分 scripts/ci/aiGovernanceTiny.mjs' },
      dimensions: [{ id: 'maintainability-headroom', status: 'warn' }],
    },
  }, { generatedAt: AI_GOVERNANCE_ARTIFACT_GENERATED_AT });

  assert.match(summary, /Generated: 2026-07-10T01:02:03\.000Z/);
  assert.match(summary, /Maturity score: 88\/100 \(warn\)/);
  assert.match(summary, /Behavior evals: 2\/13 behavior cases with outcomes; 3 component-boundary cases excluded/);
  assert.match(summary, /Learning: 1 open signals; 1 experiments; 6 planned trials/);
  assert.match(summary, /Maintainability: warn/);
  assert.match(summary, /优先拆分 scripts\/ci\/aiGovernanceTiny\.mjs/);
  assert.match(summary, /Latest decision: 2026-07-10 固化 CI 治理 JSON 产物/);
});
