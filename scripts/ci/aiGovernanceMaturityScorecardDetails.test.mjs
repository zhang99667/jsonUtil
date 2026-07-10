import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';

const governanceReport = {
  ok: true,
  counts: { requiredFiles: 28, referenceRules: 16 },
  failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
};

test('AI 治理成熟度 scorecard 结构化标记 AI 基建候选清零状态', () => {
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport,
    budgetReport: { ok: true, items: { highUsage: [{ file: 'frontend/src/tight.ts', remainingLines: 1, usageRatio: 0.98 }] } },
  });

  assert.deepEqual(scorecard.nextFocus.details.maintainabilityHotspots, {
    riskyCount: 1,
    aiCandidateCount: 0,
    aiInfraCleared: true,
    ordinaryRiskyCount: 1,
    nextAction: 'AI 基建候选已清零；普通热点交给对应领域预算处理',
  });
});
