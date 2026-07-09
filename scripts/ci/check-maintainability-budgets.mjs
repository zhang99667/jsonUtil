#!/usr/bin/env node
// 校验已知复杂模块和新拆分 helper 的行数预算，防止可维护性债务反弹。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMaintainabilityBudgetCliArgs } from './maintainabilityBudgetCliArgs.mjs';
import {
  formatMaintainabilityBudgetJsonReport,
  hasMaintainabilityBudgetFailures,
  printMaintainabilityBudgetHumanReport,
} from './maintainabilityBudgetCliOutput.mjs';
import { buildMaintainabilityBudgetReport } from './maintainabilityBudgetReport.mjs';
import { maintainabilityBudgets } from './maintainability-budget-rules.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportOptions = parseMaintainabilityBudgetCliArgs(process.argv.slice(2));
const report = buildMaintainabilityBudgetReport(rootDir, maintainabilityBudgets, reportOptions);
const outputContext = { options: reportOptions, totalBudgets: maintainabilityBudgets.length };

if (reportOptions.outputJson) {
  process.stdout.write(formatMaintainabilityBudgetJsonReport(report, outputContext));
}

if (hasMaintainabilityBudgetFailures(report)) {
  if (!reportOptions.outputJson) printMaintainabilityBudgetHumanReport(report, outputContext);
  process.exit(1);
}

if (!reportOptions.outputJson) printMaintainabilityBudgetHumanReport(report, outputContext);
