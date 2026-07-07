const getFlagValue = (args, index, flag) => {
  const arg = args[index];
  if (arg === flag) return [args[index + 1], index + 1];
  if (arg.startsWith(`${flag}=`)) return [arg.slice(flag.length + 1), index];
  return null;
};

const parseNumberOption = (value, normalize) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return normalize(parsed);
};

export const parseMaintainabilityBudgetCliArgs = (args) => {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--no-all') options.printAllSummaries = false;

    const top = getFlagValue(args, index, '--top');
    if (top) {
      const highUsageLimit = parseNumberOption(top[0], Math.floor);
      options.printAllSummaries = false;
      if (highUsageLimit !== undefined || top[0] === '0') options.highUsageLimit = highUsageLimit ?? 0;
      index = top[1];
      continue;
    }

    const threshold = getFlagValue(args, index, '--threshold');
    if (threshold) {
      const highUsageMinRatio = parseNumberOption(threshold[0], value => (value > 1 ? value / 100 : value));
      if (highUsageMinRatio !== undefined) options.highUsageMinRatio = highUsageMinRatio;
      index = threshold[1];
    }
  }

  return options;
};
