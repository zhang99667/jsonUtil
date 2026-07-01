export const DEFAULT_HIGH_USAGE_LIMIT = 10;
export const DEFAULT_HIGH_USAGE_MIN_RATIO = 0.8;

export const formatBudgetUsage = ({ file, lineCount, maxLines }) => `${file}: ${lineCount}/${maxLines}`;

const getUsageRatio = ({ lineCount, maxLines }) => (maxLines > 0 ? lineCount / maxLines : 0);

const getRemainingLines = ({ lineCount, maxLines }) => maxLines - lineCount;

const compareHighUsage = (left, right) => (
  getUsageRatio(right) - getUsageRatio(left) ||
  getRemainingLines(left) - getRemainingLines(right) ||
  left.file.localeCompare(right.file)
);

export const buildNearLimitSummaries = (nearLimitUsages) => nearLimitUsages
  .sort((left, right) => (
    getRemainingLines(left) - getRemainingLines(right) ||
    getUsageRatio(right) - getUsageRatio(left) ||
    left.file.localeCompare(right.file)
  ))
  .map(usage => `${formatBudgetUsage(usage)}，剩余 ${getRemainingLines(usage)} 行`);

export const buildHighUsageSummaries = (
  usages,
  {
    highUsageLimit = DEFAULT_HIGH_USAGE_LIMIT,
    highUsageMinRatio = DEFAULT_HIGH_USAGE_MIN_RATIO,
  } = {}
) => usages
  .filter(usage => usage.lineCount <= usage.maxLines && getUsageRatio(usage) >= highUsageMinRatio)
  .sort(compareHighUsage)
  .slice(0, highUsageLimit)
  .map(usage => (
    `${formatBudgetUsage(usage)}，使用率 ${(getUsageRatio(usage) * 100).toFixed(1)}%，剩余 ${getRemainingLines(usage)} 行`
  ));
