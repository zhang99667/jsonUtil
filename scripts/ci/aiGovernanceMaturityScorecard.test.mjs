import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';

test('AI 治理成熟度 scorecard 会把预算热点标成下一步焦点', () => {
  const governanceReport = {
    ok: true, counts: { requiredFiles: 28, referenceRules: 16 },
    failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
  };
  const highUsage = [
    { file: 'frontend/src/tight.ts', remainingLines: 1, usageRatio: 0.98 },
    { file: 'scripts/ci/aiGovernanceReferenceEntryMissingCases.mjs', remainingLines: 9, usageRatio: 0.92 },
    { file: 'scripts/ci/maintainability-budget-governance-ai-test-rules.mjs', remainingLines: 2, usageRatio: 0.96 },
    { file: 'scripts/ci/write-ai-governance-artifacts.test.mjs', remainingLines: 9, usageRatio: 0.89 },
  ];
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport,
    budgetReport: { ok: true, items: { highUsage } },
  });

  assert.equal(scorecard.reportType, 'ai-governance-maturity-scorecard');
  assert.equal(scorecard.status, 'warn');
  assert.equal(scorecard.score, 88);
  assert.equal(scorecard.nextFocus.id, 'maintainability-headroom');
  assert.match(scorecard.nextFocus.nextAction, /maintainability-budget-governance-ai-test-rules\.mjs/);
  assert.match(scorecard.nextFocus.evidence, /3 个 AI 基建候选/);

  const aiCandidateScorecard = buildAiGovernanceMaturityScorecard({
    governanceReport,
    budgetReport: { ok: true, items: { highUsage: highUsage.slice(0, 2) } },
  });
  assert.match(aiCandidateScorecard.nextFocus.nextAction, /aiGovernanceReferenceEntryMissingCases\.mjs/);

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
