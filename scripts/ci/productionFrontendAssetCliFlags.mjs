export const PRINT_PRODUCTION_ASSET_PATHS_FLAG = '--print-paths';

const EXTRA_ASSET_FLAGS = new Set(['--extra-asset', '--extra-assets']);
const EXTRA_ASSET_ASSIGNMENT_PATTERN = /^--extra-assets?=(.*)$/;

export const isPrintProductionAssetPathsFlag = arg => (
  arg === PRINT_PRODUCTION_ASSET_PATHS_FLAG
);

export const readProductionExtraAssetCliFlag = (arg, nextArg = '') => {
  if (EXTRA_ASSET_FLAGS.has(arg)) {
    return {
      value: nextArg,
      shouldConsumeNextArg: true,
    };
  }

  const inlineExtraAssetArg = arg.match(EXTRA_ASSET_ASSIGNMENT_PATTERN)?.[1];
  if (inlineExtraAssetArg !== undefined) {
    return {
      value: inlineExtraAssetArg,
      shouldConsumeNextArg: false,
    };
  }

  return null;
};
