import { normalizeProductionAssetPath } from './productionFrontendAssetPathNormalization.mjs';

const DEFAULT_PAGES = ['/', '/admin.html'];

const addProductionAssetPath = (assetPaths, assetPath) => assetPath && assetPaths.add(assetPath);

export const extractFrontendAssetPathsFromHtml = (html) => {
  const assetPaths = new Set();
  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
    addProductionAssetPath(assetPaths, normalizeProductionAssetPath(match[1]));
  }
  return [...assetPaths];
};

export const getProductionAssetPagesFromEnv = () => {
  const rawPages = process.env.FRONTEND_ASSET_VERIFY_PAGES;
  if (!rawPages) return DEFAULT_PAGES;
  return rawPages.split(',').map(page => page.trim()).filter(Boolean);
};

export { extractFrontendAssetPathsFromJavascript } from './productionFrontendAssetJavascriptPaths.mjs';
