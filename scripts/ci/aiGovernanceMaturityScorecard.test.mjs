import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';

const READY_SCOPE = { ok: true, counts: { assets: 2, failures: 0 }, failureSample: [], truncated: false };
const PASS_DISTRIBUTION = {
  schemaVersion: 1, reportType: 'ai-asset-distribution-readiness', ok: true,
  stability: { status: 'stable', sourceDrift: 0, gitInventoryDrift: 0, sourceReadErrors: 0, gitInventoryErrors: 0 },
  counts: { assets: 2, failedScopes: 0 }, readiness: { workspaceCandidate: true, nextCommit: true, clone: true },
  scopes: { workspace: READY_SCOPE, index: READY_SCOPE, head: READY_SCOPE },
};

test('AI 治理成熟度 scorecard 会区分职责审计与容量复核', () => {
  const governanceReport = {
    ok: true, counts: { requiredFiles: 28, referenceRules: 16 },
    failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
    evolutionEvals: { ok: true, counts: { cases: 13, outcomes: 13, pass: 13, partial: 0, fail: 0, coveredCases: 13 }, coverage: { outcomes: { percent: 100 } }, ledgerChain: { status: 'pass' }, nextFocus: { nextAction: '保持真实 outcome 记录' } },
    distributionReadiness: PASS_DISTRIBUTION,
  };
  const highUsage = [
    { file: 'frontend/src/tight.ts', remainingLines: 1, usageRatio: 0.98 },
    { file: 'scripts/ci/aiGovernanceReferenceEntryMissingCases.mjs', remainingLines: 9, usageRatio: 0.92 },
    { file: 'scripts/ci/maintainability-budget-governance-ai-test-rules.mjs', remainingLines: 2, usageRatio: 0.96 },
    { file: 'scripts/ci/write-ai-governance-artifacts.test.mjs', remainingLines: 9, usageRatio: 0.89 },
    { file: 'scripts/mcp/jsonutils-governance-stable.mjs', remainingLines: 12, usageRatio: 0.84 },
  ];
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport,
    budgetReport: { ok: true, items: { highUsage: highUsage.slice(0, 1), scorecardCandidates: highUsage } },
  });

  assert.equal(scorecard.reportType, 'ai-governance-maturity-scorecard');
  assert.equal(scorecard.schemaVersion, 2);
  assert.equal(scorecard.status, 'warn');
  assert.equal(scorecard.score, 92);
  assert.equal(scorecard.nextFocus.id, 'maintainability-headroom');
  assert.match(scorecard.nextFocus.nextAction, /write-ai-governance-artifacts\.test\.mjs/);
  assert.equal(scorecard.nextFocus.details.maintainabilityHotspots.priority.action, 'responsibility-review');
  assert.match(scorecard.nextFocus.evidence, /3 个 AI 基建候选/);

  const aiCandidateScorecard = buildAiGovernanceMaturityScorecard({
    governanceReport,
    budgetReport: { ok: true, items: { highUsage: highUsage.slice(0, 2) } },
  });
  assert.match(aiCandidateScorecard.nextFocus.nextAction, /aiGovernanceReferenceEntryMissingCases\.mjs/);
  assert.equal(aiCandidateScorecard.nextFocus.details.maintainabilityHotspots.priority.action, 'capacity-review');
  assert.doesNotMatch(aiCandidateScorecard.nextFocus.nextAction, /优先拆分/);

  const artifactScorecard = buildAiGovernanceMaturityScorecard({
    governanceReport,
    budgetReport: { ok: true, items: { highUsage: [highUsage[0], highUsage[3]] } },
  });
  assert.match(artifactScorecard.nextFocus.nextAction, /write-ai-governance-artifacts\.test\.mjs/);

  const fallbackScorecard = buildAiGovernanceMaturityScorecard({
    governanceReport,
    budgetReport: { ok: true, items: { highUsage: [{ file: 'frontend/src/tight.ts', remainingLines: 1, usageRatio: 0.98 }] } },
  });
  assert.equal(fallbackScorecard.nextFocus.nextAction, 'AI 基建候选已清零；普通热点交给对应领域预算处理');
  assert.match(fallbackScorecard.nextFocus.evidence, /0 个 AI 基建候选/);
});
