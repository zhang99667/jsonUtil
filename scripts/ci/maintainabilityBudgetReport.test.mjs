import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildMaintainabilityBudgetReport } from './maintainabilityBudgetReport.mjs';

const writeLines = (rootDir, relativePath, lineCount) => {
  const filePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Array.from({ length: lineCount }, (_, index) => `line ${index + 1}`).join('\n'));
};

const withBudgetFixture = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-budget-report-'));
  fs.mkdirSync(path.join(rootDir, 'scripts/ci'), { recursive: true });
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('可维护性预算报告会突出接近上限的文件', () => {
  withBudgetFixture((rootDir) => {
    writeLines(rootDir, 'src/tight.js', 9);
    writeLines(rootDir, 'src/large-near.js', 91);
    writeLines(rootDir, 'src/roomy.js', 10);
    writeLines(rootDir, 'scripts/ci/maintainability-budget-demo-rules.mjs', 1);

    const report = buildMaintainabilityBudgetReport(rootDir, [
      { file: 'src/large-near.js', maxLines: 100, reason: 'large near' },
      { file: 'src/tight.js', maxLines: 10, reason: 'tight' },
      { file: 'src/roomy.js', maxLines: 20, reason: 'roomy' },
      {
        file: 'scripts/ci/maintainability-budget-demo-rules.mjs',
        maxLines: 10,
        reason: 'rule table',
      },
    ]);

    assert.deepEqual(report.failures, []);
    assert.deepEqual(report.nearLimitSummaries, [
      'src/tight.js: 9/10，剩余 1 行',
      'src/large-near.js: 91/100，剩余 9 行',
    ]);
    assert.deepEqual(report.highUsageSummaries, [
      'src/large-near.js: 91/100，使用率 91.0%，剩余 9 行',
      'src/tight.js: 9/10，使用率 90.0%，剩余 1 行',
    ]);
    assert.deepEqual(report.summaries, [
      'src/large-near.js: 91/100',
      'src/tight.js: 9/10',
      'src/roomy.js: 10/20',
      'scripts/ci/maintainability-budget-demo-rules.mjs: 1/10',
    ]);
  });
});

test('可维护性预算报告会收集缺失文件、超预算、未自检规则表和未预算 AI 治理脚本', () => {
  withBudgetFixture((rootDir) => {
    writeLines(rootDir, 'src/over.js', 6);
    writeLines(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 1);
    writeLines(rootDir, 'scripts/ci/aiGovernanceLooseHelper.test.mjs', 1);
    writeLines(rootDir, 'scripts/ci/maintainability-budget-untracked-rules.mjs', 1);

    const report = buildMaintainabilityBudgetReport(rootDir, [
      { file: 'src/over.js', maxLines: 5, reason: 'too large' },
      { file: 'src/missing.js', maxLines: 5, reason: 'missing' },
    ]);

    assert.deepEqual(report.summaries, [
      'src/over.js: 6/5',
    ]);
    assert.deepEqual(report.nearLimitSummaries, []);
    assert.deepEqual(report.highUsageSummaries, []);
    assert.deepEqual(report.failures, [
      'scripts/ci/maintainability-budget-untracked-rules.mjs: 预算规则文件未纳入自检预算',
      'scripts/ci/aiGovernanceLooseHelper.mjs: AI 治理脚本未纳入可维护性预算',
      'src/over.js: 6/5 行，too large',
      'src/missing.js: 文件不存在，无法检查预算',
    ]);
  });
});

test('可维护性预算报告会报告重复登记', () => {
  withBudgetFixture((rootDir) => {
    writeLines(rootDir, 'src/owned.js', 3);

    const report = buildMaintainabilityBudgetReport(rootDir, [
      { file: './src/owned.js', maxLines: 5, reason: 'first owner' },
      { file: 'src/owned.js', maxLines: 8, reason: 'second owner' },
    ]);

    assert.deepEqual(report.failures, [
      'src/owned.js: 可维护性预算重复登记',
    ]);
  });
});

test('可维护性预算报告支持控制高使用率候选数量和阈值', () => {
  withBudgetFixture((rootDir) => {
    writeLines(rootDir, 'src/a.js', 81);
    writeLines(rootDir, 'src/b.js', 90);
    writeLines(rootDir, 'src/c.js', 70);

    const report = buildMaintainabilityBudgetReport(rootDir, [
      { file: 'src/a.js', maxLines: 100, reason: 'a' },
      { file: 'src/b.js', maxLines: 100, reason: 'b' },
      { file: 'src/c.js', maxLines: 100, reason: 'c' },
    ], {
      highUsageLimit: 1,
      highUsageMinRatio: 0.8,
    });

    assert.deepEqual(report.highUsageSummaries, [
      'src/b.js: 90/100，使用率 90.0%，剩余 10 行',
    ]);
  });
});
