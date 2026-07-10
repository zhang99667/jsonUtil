import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';

test('AI 治理成熟度 scorecard 会优先暴露治理失败', () => {
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport: {
      counts: { requiredFiles: 2, referenceRules: 1 },
      failures: {
        missingFiles: ['docs/AI-MISSING.md: 缺少配置文件'],
        skillContractFailures: [],
        contractFailures: [],
        missingReferences: ['AGENTS.md: 缺少关键引用'],
      },
    },
    budgetReport: { ok: true, items: { highUsage: [] } },
  });

  assert.equal(scorecard.status, 'fail');
  assert.equal(scorecard.score, 50);
  assert.equal(scorecard.nextFocus.id, 'asset-coverage');
});

test('AI 治理成熟度 scorecard 在缺少预算报告时保留 unknown 维度', () => {
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport: { requiredFiles: [], referenceRules: [], missingFiles: [], missingReferences: [] },
  });

  assert.equal(scorecard.status, 'unknown');
  assert.equal(scorecard.dimensions.find(item => item.id === 'maintainability-headroom').status, 'unknown');
});
