import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

import { toMaintainabilityBudgetJsonReport } from './maintainabilityBudgetJsonReport.mjs';

test('可维护性预算 CLI 支持 JSON 摘要输出', () => {
  const output = execFileSync(process.execPath, [
    'scripts/ci/check-maintainability-budgets.mjs', '--json', '--top=3',
  ], { cwd: process.cwd(), encoding: 'utf8' });
  const report = JSON.parse(output);

  assert.equal(report.ok, true);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.reportType, 'maintainability-budget');
  assert.equal(report.counts.failures, 0);
  assert.equal(report.failures.length, 0);
  assert.equal(report.counts.budgets > 0, true);
  assert.equal(report.summaries.all.length, 0);
  assert.equal(report.summaries.highUsage.length <= 3, true);
  assert.equal(report.items.all.length, 0);
  assert.equal(report.items.highUsage.length <= 3, true);
  assert.equal(report.items.scorecardCandidates.length >= report.items.highUsage.length, true);
  assert.equal(report.counts.scorecardCandidates, report.items.scorecardCandidates.length);
  assert.equal(typeof report.items.highUsage[0].file, 'string');
  assert.equal(typeof report.items.highUsage[0].usageRatio, 'number');
  assert.equal(Array.isArray(report.summaries.nearLimit), true);
});

test('可维护性预算 JSON 摘要会保留失败和分组计数', () => {
  const report = toMaintainabilityBudgetJsonReport({
    failures: ['src/over.js: 6/5 行，too large'],
    summaries: ['src/over.js: 6/5'],
    nearLimitSummaries: [],
    highUsageSummaries: ['src/over.js: 6/5，使用率 120.0%，剩余 -1 行'],
  }, {
    totalBudgets: 2,
  });

  assert.equal(report.ok, false);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.reportType, 'maintainability-budget');
  assert.equal(report.counts.budgets, 2);
  assert.equal(report.counts.failures, 1);
  assert.equal(report.counts.highUsageSummaries, 1);
  assert.deepEqual(report.failures, ['src/over.js: 6/5 行，too large']);
});

test('可维护性预算全局候选事实不随 top 展示参数变化', () => {
  const run = top => JSON.parse(execFileSync(process.execPath, [
    'scripts/ci/check-maintainability-budgets.mjs', '--json', `--top=${top}`,
  ], { cwd: process.cwd(), encoding: 'utf8' }));
  const topOne = run(1);
  const topThirtyFive = run(35);

  assert.equal(topOne.items.highUsage.length, 1);
  assert.deepEqual(topOne.items.scorecardCandidates, topThirtyFive.items.scorecardCandidates);
  assert.equal(topOne.counts.scorecardCandidates, topThirtyFive.counts.scorecardCandidates);
});
