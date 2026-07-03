#!/usr/bin/env node
// 校验已知复杂模块和新拆分 helper 的行数预算，防止可维护性债务反弹。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMaintainabilityBudgetCliArgs } from './maintainabilityBudgetCliArgs.mjs';
import { buildMaintainabilityBudgetReport } from './maintainabilityBudgetReport.mjs';
import { maintainabilityBudgets } from './maintainability-budget-rules.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportOptions = parseMaintainabilityBudgetCliArgs(process.argv.slice(2));
const {
  failures,
  summaries,
  nearLimitSummaries,
  highUsageSummaries,
} = buildMaintainabilityBudgetReport(rootDir, maintainabilityBudgets, reportOptions);

if (failures.length > 0) {
  console.error('可维护性预算检查失败:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`可维护性预算检查通过，共 ${maintainabilityBudgets.length} 个文件。`);
if (nearLimitSummaries.length > 0) {
  console.log(`接近预算上限 ${nearLimitSummaries.length} 个文件（剩余 ≤5 行或使用率 ≥90%）：`);
  for (const summary of nearLimitSummaries) {
    console.log(`! ${summary}`);
  }
}
if (highUsageSummaries.length > 0) {
  console.log(`高使用率候选 ${highUsageSummaries.length} 个：`);
  for (const summary of highUsageSummaries) {
    console.log(`> ${summary}`);
  }
}
if (reportOptions.printAllSummaries !== false) {
  for (const summary of summaries) {
    console.log(`- ${summary}`);
  }
}
