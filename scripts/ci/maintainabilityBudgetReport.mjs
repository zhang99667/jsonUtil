import fs from 'node:fs';
import path from 'node:path';
import { collectUnbudgetedAiGovernanceScriptFailures, collectUntrackedBudgetRuleFailures } from './maintainabilityBudgetRuleFiles.mjs';
import {
  buildHighUsageItems,
  buildNearLimitUsageItems,
  buildScorecardCandidateItems,
  toBudgetUsageItem,
} from './maintainabilityBudgetUsageItems.mjs';
import { buildHighUsageSummaries, buildNearLimitSummaries, formatBudgetUsage } from './maintainabilityBudgetUsageSummaries.mjs';

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

const collectDuplicateBudgetFailures = (budgets) => {
  const seenFiles = new Set();
  return budgets.flatMap(({ file }) => {
    if (!seenFiles.has(file)) {
      seenFiles.add(file);
      return [];
    }
    return [`${file}: 可维护性预算重复登记`];
  });
};

export const buildMaintainabilityBudgetReport = (rootDir, budgets, options = {}) => {
  const failures = [];
  const summaries = [];
  const usages = [];
  const nearLimitUsages = [];
  const normalizedBudgets = budgets.map(budget => ({ ...budget, file: path.posix.normalize(budget.file).replace(/^\.\//, '') }));
  const budgetedFiles = new Set(normalizedBudgets.map(budget => budget.file));

  failures.push(...collectDuplicateBudgetFailures(normalizedBudgets));
  failures.push(...collectUntrackedBudgetRuleFailures(rootDir, budgetedFiles));
  failures.push(...collectUnbudgetedAiGovernanceScriptFailures(rootDir, budgetedFiles));

  for (const budget of normalizedBudgets) {
    const filePath = path.join(rootDir, budget.file);
    if (!fs.existsSync(filePath)) {
      failures.push(`${budget.file}: 文件不存在，无法检查预算`);
      continue;
    }

    const lineCount = countLines(filePath);
    const usage = { ...budget, lineCount };
    usages.push(usage);
    summaries.push(formatBudgetUsage(usage));
    if (isNearLimitUsage(usage)) nearLimitUsages.push(usage);
    if (lineCount > budget.maxLines) failures.push(`${budget.file}: ${lineCount}/${budget.maxLines} 行，${budget.reason}`);
  }

  const nearLimitSummaries = buildNearLimitSummaries(nearLimitUsages);
  const highUsageSummaries = buildHighUsageSummaries(usages, options);
  const usageItems = usages.map(toBudgetUsageItem);
  const nearLimitItems = buildNearLimitUsageItems(nearLimitUsages);
  const highUsageItems = buildHighUsageItems(usages, options);
  const highUsageCandidateCount = buildHighUsageItems(usages, { ...options, highUsageLimit: Number.MAX_SAFE_INTEGER }).length;
  const scorecardCandidateItems = buildScorecardCandidateItems(usages);

  return {
    failures,
    summaries,
    nearLimitSummaries,
    highUsageSummaries,
    usageItems,
    nearLimitItems,
    highUsageItems,
    highUsageCandidateCount,
    scorecardCandidateItems,
  };
};
