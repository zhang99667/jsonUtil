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
      evolutionEvals: { ok: true, counts: { cases: 13, outcomes: 13, pass: 13, partial: 0, fail: 0, coveredCases: 13 }, coverage: { outcomes: { percent: 100 } }, ledgerChain: { status: 'pass' }, nextFocus: { nextAction: '保持真实 outcome 记录' } },
    },
    budgetReport: { ok: true, items: { highUsage: [] } },
  });

  assert.equal(scorecard.status, 'fail');
  assert.equal(scorecard.score, 60);
  assert.equal(scorecard.nextFocus.id, 'asset-coverage');
});

test('AI 治理成熟度 scorecard 在缺少预算报告时保留 unknown 维度', () => {
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport: {
      counts: { requiredFiles: 2, referenceRules: 1 },
      failures: { missingFiles: [], missingReferences: [], skillContractFailures: [], contractFailures: [] },
    },
  });

  assert.equal(scorecard.status, 'unknown');
  assert.equal(scorecard.dimensions.find(item => item.id === 'maintainability-headroom').status, 'unknown');
});

test('AI 治理成熟度 scorecard 让 fail 优先于更早的 warn', () => {
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport: {
      counts: { requiredFiles: 2, referenceRules: 1 },
      failures: { missingFiles: [], missingReferences: [], skillContractFailures: [], contractFailures: [] },
      evolutionEvals: {
        ok: true,
        counts: { cases: 13, outcomes: 1, pass: 1, partial: 0, fail: 0, coveredCases: 1 },
        coverage: { outcomes: { percent: 8 } },
        nextFocus: { nextAction: '补 outcome' },
      },
    },
    budgetReport: { ok: false, items: { highUsage: [] } },
  });
  assert.equal(scorecard.status, 'fail');
  assert.equal(scorecard.nextFocus.id, 'maintainability-headroom');
});

test('AI 治理成熟度 scorecard 对无法解析的治理报告 fail closed', () => {
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport: { ok: false, parseError: 'boom' },
    budgetReport: { ok: true, items: { highUsage: [] } },
  });
  assert.equal(scorecard.status, 'fail');
  assert.deepEqual(scorecard.dimensions.slice(0, 3).map(item => item.status), ['fail', 'fail', 'fail']);
});
