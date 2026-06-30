import { normalizeProductionAssetPath } from './productionFrontendAssetPathNormalization.mjs';

const CSS_RELATIVE_ASSET_EXTENSION_PATTERN = /\.(?:css|wasm|json|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)(?:$|[?#])/i;
const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

const normalizeCssRelativeAssetPath = (value, currentAssetPath) => {
  const rawValue = String(value || '').trim();
  if (!CSS_RELATIVE_ASSET_EXTENSION_PATTERN.test(rawValue) || ABSOLUTE_URL_PATTERN.test(rawValue)) {
    return null;
  }

  const cleanValue = rawValue.split(/[?#]/)[0];
  const assetPath = new URL(cleanValue, `https://jsonutils.local${currentAssetPath}`).pathname;
  return assetPath.startsWith('/assets/') ? assetPath : null;
};

export const normalizeCssAssetPath = (value, currentAssetPath) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return null;
  return normalizeProductionAssetPath(rawValue) || normalizeCssRelativeAssetPath(rawValue, currentAssetPath);
};
