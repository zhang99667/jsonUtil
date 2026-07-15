import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';

const governanceReport = {
  ok: true,
  counts: { requiredFiles: 28, referenceRules: 16 },
  failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
  evolutionEvals: { ok: true, counts: { cases: 13, outcomes: 13, pass: 13, partial: 0, fail: 0, coveredCases: 13 }, coverage: { outcomes: { percent: 100 } }, ledgerChain: { status: 'pass' }, nextFocus: { nextAction: '保持真实 outcome 记录' } },
};

test('AI 治理成熟度 scorecard 结构化标记 AI 基建候选清零状态', () => {
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport,
    budgetReport: { ok: true, items: { highUsage: [{ file: 'frontend/src/tight.ts', remainingLines: 1, usageRatio: 0.98 }] } },
  });

  assert.deepEqual(scorecard.nextFocus.details.maintainabilityHotspots, {
    riskyCount: 1,
    aiCandidateCount: 0,
    responsibilityCandidateCount: 0,
    capacityReviewCandidateCount: 0,
    aiInfraCleared: true,
    ordinaryRiskyCount: 1,
    priority: { file: 'frontend/src/tight.ts', action: 'domain-budget-review' },
    nextAction: 'AI 基建候选已清零；普通热点交给对应领域预算处理',
  });
});
