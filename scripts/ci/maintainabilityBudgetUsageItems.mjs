export const DEFAULT_HIGH_USAGE_LIMIT = 10;
export const DEFAULT_HIGH_USAGE_MIN_RATIO = 0.8;

const getUsageRatio = ({ lineCount, maxLines }) => (maxLines > 0 ? lineCount / maxLines : 0);

const getRemainingLines = ({ lineCount, maxLines }) => maxLines - lineCount;

export const toBudgetUsageItem = (usage) => ({
  file: usage.file,
  lineCount: usage.lineCount,
  maxLines: usage.maxLines,
  remainingLines: getRemainingLines(usage),
  usageRatio: Number(getUsageRatio(usage).toFixed(4)),
  reason: usage.reason,
});

const compareHighUsage = (left, right) => (
  getUsageRatio(right) - getUsageRatio(left) ||
  getRemainingLines(left) - getRemainingLines(right) ||
  left.file.localeCompare(right.file)
);

export const buildNearLimitUsageItems = nearLimitUsages => nearLimitUsages
  .sort((left, right) => (
    getRemainingLines(left) - getRemainingLines(right) ||
    getUsageRatio(right) - getUsageRatio(left) ||
    left.file.localeCompare(right.file)
  ))
  .map(toBudgetUsageItem);

export const buildHighUsageItems = (
  usages,
  {
    highUsageLimit = DEFAULT_HIGH_USAGE_LIMIT,
    highUsageMinRatio = DEFAULT_HIGH_USAGE_MIN_RATIO,
  } = {}
) => usages
  .filter(usage => usage.lineCount <= usage.maxLines && getUsageRatio(usage) >= highUsageMinRatio)
  .sort(compareHighUsage)
  .slice(0, highUsageLimit)
  .map(toBudgetUsageItem);
