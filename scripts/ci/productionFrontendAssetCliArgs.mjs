import {
  getExtraProductionAssetPathsFromEnv,
  parseProductionAssetPathList,
} from './productionFrontendAssetExtras.mjs';
import {
  isPrintProductionAssetPathsFlag,
  PRINT_PRODUCTION_ASSET_PATHS_FLAG,
  readProductionExtraAssetCliFlag,
} from './productionFrontendAssetCliFlags.mjs';

const DEFAULT_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://jsonutils.markz.fun';

export const parseProductionFrontendAssetCliArgs = (args = process.argv.slice(2)) => {
  const positional = [];
  const rawExtraAssetArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const extraAssetFlag = readProductionExtraAssetCliFlag(arg, args[index + 1] || '');
    if (isPrintProductionAssetPathsFlag(arg)) continue;
    if (extraAssetFlag) {
      rawExtraAssetArgs.push(extraAssetFlag.value);
      if (extraAssetFlag.shouldConsumeNextArg) index += 1;
      continue;
    }
    positional.push(arg);
  }

  const cliExtraAssetPaths = parseProductionAssetPathList(rawExtraAssetArgs.join('\n'));

  return {
    baseUrl: positional[0] || DEFAULT_BASE_URL,
    extraAssetPaths: [...new Set([
      ...getExtraProductionAssetPathsFromEnv(),
      ...cliExtraAssetPaths,
    ])],
    shouldPrintPaths: args.includes(PRINT_PRODUCTION_ASSET_PATHS_FLAG),
  };
};
