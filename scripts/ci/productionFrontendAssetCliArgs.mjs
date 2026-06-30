import {
  getExtraProductionAssetPathsFromEnv,
  parseProductionAssetPathList,
} from './productionFrontendAssetExtras.mjs';

const DEFAULT_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://jsonutils.markz.fun';
const PRINT_PATHS_FLAG = '--print-paths';
const EXTRA_ASSET_FLAGS = new Set(['--extra-asset', '--extra-assets']);
const EXTRA_ASSET_ASSIGNMENT_PATTERN = /^--extra-assets?=(.*)$/;

const readInlineExtraAssetArg = arg => arg.match(EXTRA_ASSET_ASSIGNMENT_PATTERN)?.[1] ?? null;

export const parseProductionFrontendAssetCliArgs = (args = process.argv.slice(2)) => {
  const positional = [];
  const rawExtraAssetArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const inlineExtraAssetArg = readInlineExtraAssetArg(arg);
    if (arg === PRINT_PATHS_FLAG) continue;
    if (EXTRA_ASSET_FLAGS.has(arg)) {
      rawExtraAssetArgs.push(args[index + 1] || '');
      index += 1;
      continue;
    }
    if (inlineExtraAssetArg !== null) {
      rawExtraAssetArgs.push(inlineExtraAssetArg);
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
    shouldPrintPaths: args.includes(PRINT_PATHS_FLAG),
  };
};
