import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildMaintainabilityHotspotSummary } from './aiGovernanceMaturityScorecardHotspots.mjs';

const candidate = (file, remainingLines = 0, usageRatio = 1) => ({
  file,
  remainingLines,
  usageRatio,
});

const summarize = scorecardCandidates => buildMaintainabilityHotspotSummary({
  items: { highUsage: scorecardCandidates.slice(0, 1), scorecardCandidates },
});

test('维护热点优先审计真实职责候选，不让纯预算表压过实现文件', () => {
  const implementationFile = 'scripts/ci/aiGovernanceProjectPluginLifecycle.mjs';
  const summary = summarize([
    candidate('scripts/ci/maintainability-budget-governance-ai-codex-runtime-rules.mjs'),
    candidate(implementationFile, 4, 0.86),
  ]);

  assert.equal(summary.aiCandidateCount, 2);
  assert.equal(summary.responsibilityCandidateCount, 1);
  assert.equal(summary.capacityReviewCandidateCount, 1);
  assert.deepEqual(summary.priority, {
    file: implementationFile,
    action: 'responsibility-review',
  });
  assert.match(summary.nextAction, /审计 .*aiGovernanceProjectPluginLifecycle\.mjs.*职责与覆盖/);
  assert.doesNotMatch(summary.nextAction, /优先拆分/);
});

test('维护热点只剩容量候选时保留风险可见性但拒绝机械拆分', () => {
  const budgetFile = 'scripts/ci/maintainability-budget-governance-ai-codex-runtime-rules.mjs';
  const summary = summarize([
    candidate(budgetFile),
    candidate('scripts/ci/aiGovernanceRequiredMcpFiles.mjs'),
    candidate('scripts/ci/aiGovernanceExampleTestFixtures.mjs'),
    candidate('scripts/ci/aiGovernanceExampleMissingCases.mjs'),
  ]);

  assert.equal(summary.aiCandidateCount, 4);
  assert.equal(summary.responsibilityCandidateCount, 0);
  assert.equal(summary.capacityReviewCandidateCount, 4);
  assert.equal(summary.aiInfraCleared, false);
  assert.deepEqual(summary.priority, { file: budgetFile, action: 'capacity-review' });
  assert.match(summary.nextAction, /容量复核项/);
  assert.match(summary.nextAction, /不机械拆分/);
  assert.doesNotMatch(summary.nextAction, /已清零|优先拆分/);
});

test('维护热点在同一风险等级先审计实现，再处理测试组织', () => {
  const implementationFile = 'scripts/ci/aiGovernanceCodexExecTraceProjection.mjs';
  const summary = summarize([
    candidate('scripts/mcp/jsonutils-governance-runtime-freshness.test.mjs'),
    candidate(implementationFile, 1, 0.997),
  ]);

  assert.deepEqual(summary.priority, {
    file: implementationFile,
    action: 'responsibility-review',
  });
});

test('维护热点容量分类只接受闭合文件名，不吞掉近似实现文件', () => {
  const firstFile = 'scripts/ci/maintainability-budget-governance-ai-core-rules.test.mjs';
  const summary = summarize([
    candidate(firstFile),
    candidate('scripts/ci/aiGovernanceRequiredMcpFileState.mjs'),
  ]);

  assert.equal(summary.responsibilityCandidateCount, 2);
  assert.equal(summary.capacityReviewCandidateCount, 0);
  assert.deepEqual(summary.priority, {
    file: 'scripts/ci/aiGovernanceRequiredMcpFileState.mjs',
    action: 'responsibility-review',
  });
});

test('维护热点缺少预算事实时不伪造优先文件', () => {
  assert.deepEqual(buildMaintainabilityHotspotSummary(), {
    riskyCount: 0,
    aiCandidateCount: 0,
    responsibilityCandidateCount: 0,
    capacityReviewCandidateCount: 0,
    aiInfraCleared: true,
    ordinaryRiskyCount: 0,
    priority: null,
    nextAction: '补充可维护性预算 JSON 报告',
  });
});
