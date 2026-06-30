import {
  normalizeProductionAssetPath,
  normalizeRelativeProductionAssetPath,
} from './productionFrontendAssetPathNormalization.mjs';

const DOCUMENT_EXAMPLE_ASSET_PATHS = new Set([
  '/assets/chunk.js',
  '/assets/theme.css',
  '/assets/worker.js',
]);

const isDocumentExampleAssetPath = (assetPath) =>
  assetPath.includes('*') || DOCUMENT_EXAMPLE_ASSET_PATHS.has(assetPath);

const addProductionAssetPath = (assetPaths, assetPath) =>
  assetPath && !isDocumentExampleAssetPath(assetPath) && assetPaths.add(assetPath);

export const extractFrontendAssetPathsFromJavascript = (javascript, currentAssetPath = '/assets/') => {
  const assetPaths = new Set();
  for (const match of javascript.matchAll(/["'`](\/?assets\/[^"'`]+)["'`]/g)) {
    addProductionAssetPath(assetPaths, normalizeProductionAssetPath(match[1]));
  }
  for (const match of javascript.matchAll(/["'`](\.{1,2}\/[^"'`]+)["'`]/g)) {
    addProductionAssetPath(assetPaths, normalizeRelativeProductionAssetPath(match[1], currentAssetPath));
  }
  for (const match of javascript.matchAll(/\bnew\s+URL\(\s*["'`]([^"'`]+)["'`]\s*,\s*import\.meta\.url\s*\)/g)) {
    addProductionAssetPath(
      assetPaths,
      normalizeProductionAssetPath(match[1]) || normalizeRelativeProductionAssetPath(match[1], currentAssetPath, true)
    );
  }
  return [...assetPaths];
};
