import {
  buildHighUsageItems,
  buildNearLimitUsageItems,
} from './maintainabilityBudgetUsageItems.mjs';

export {
  DEFAULT_HIGH_USAGE_LIMIT,
  DEFAULT_HIGH_USAGE_MIN_RATIO,
} from './maintainabilityBudgetUsageItems.mjs';

export const formatBudgetUsage = ({ file, lineCount, maxLines }) => `${file}: ${lineCount}/${maxLines}`;

export const buildNearLimitSummaries = nearLimitUsages => buildNearLimitUsageItems(nearLimitUsages)
  .map(item => `${formatBudgetUsage(item)}，剩余 ${item.remainingLines} 行`);

export const buildHighUsageSummaries = (usages, options) => buildHighUsageItems(usages, options)
  .map(item => (
    `${formatBudgetUsage(item)}，使用率 ${(item.usageRatio * 100).toFixed(1)}%，剩余 ${item.remainingLines} 行`
  ));
