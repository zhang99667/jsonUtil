import fs from 'node:fs';
import path from 'node:path';
import { collectUntrackedBudgetRuleFailures } from './maintainabilityBudgetRuleFiles.mjs';
import {
  buildHighUsageSummaries,
  buildNearLimitSummaries,
  formatBudgetUsage,
} from './maintainabilityBudgetUsageSummaries.mjs';

export const NEAR_LIMIT_REMAINING_LINES = 5;
export const NEAR_LIMIT_USAGE_RATIO = 0.9;

export const countLines = (filePath) => {
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text) return 0;
  return text.endsWith('\n')
    ? text.split('\n').length - 1
    : text.split('\n').length;
};

const isNearLimitUsage = ({ lineCount, maxLines }) => {
  const remainingLines = maxLines - lineCount;
  if (remainingLines < 0) return false;
  return remainingLines <= NEAR_LIMIT_REMAINING_LINES ||
    lineCount / maxLines >= NEAR_LIMIT_USAGE_RATIO;
};

export const buildMaintainabilityBudgetReport = (rootDir, budgets, options = {}) => {
  const failures = [];
  const summaries = [];
  const usages = [];
  const nearLimitUsages = [];
  const budgetedFiles = new Set(budgets.map(budget => budget.file));

  failures.push(...collectUntrackedBudgetRuleFailures(rootDir, budgetedFiles));

  for (const budget of budgets) {
    const filePath = path.join(rootDir, budget.file);
    if (!fs.existsSync(filePath)) {
      failures.push(`${budget.file}: 文件不存在，无法检查预算`);
      continue;
    }

    const lineCount = countLines(filePath);
    const usage = { ...budget, lineCount };
    usages.push(usage);
    summaries.push(formatBudgetUsage(usage));
    if (isNearLimitUsage(usage)) {
      nearLimitUsages.push(usage);
    }
    if (lineCount > budget.maxLines) {
      failures.push(`${budget.file}: ${lineCount}/${budget.maxLines} 行，${budget.reason}`);
    }
  }

  const nearLimitSummaries = buildNearLimitSummaries(nearLimitUsages);
  const highUsageSummaries = buildHighUsageSummaries(usages, options);

  return { failures, summaries, nearLimitSummaries, highUsageSummaries };
};
