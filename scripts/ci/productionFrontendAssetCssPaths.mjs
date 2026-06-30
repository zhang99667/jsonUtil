import { normalizeCssAssetPath } from './productionFrontendAssetCssNormalization.mjs';

const CSS_URL_PATTERN = /\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^'")]+))\s*\)/g;
const CSS_IMPORT_PATTERN = /@import\s+(?:"([^"]+)"|'([^']+)')/g;
const CSS_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;

export const isProductionFrontendCssAsset = assetPath => /^\/assets\/.+\.css$/i.test(assetPath);

const addCssAssetPath = (assetPaths, value, currentAssetPath) => {
  const assetPath = normalizeCssAssetPath(value, currentAssetPath);
  if (assetPath) assetPaths.add(assetPath);
};

export const extractFrontendAssetPathsFromCss = (css, currentAssetPath = '/assets/') => {
  const assetPaths = new Set();
  const normalizedCss = String(css || '').replace(CSS_COMMENT_PATTERN, '');
  for (const match of normalizedCss.matchAll(CSS_URL_PATTERN)) {
    addCssAssetPath(assetPaths, match[1] ?? match[2] ?? match[3], currentAssetPath);
  }
  for (const match of normalizedCss.matchAll(CSS_IMPORT_PATTERN)) {
    addCssAssetPath(assetPaths, match[1] ?? match[2], currentAssetPath);
  }
  return [...assetPaths];
};
