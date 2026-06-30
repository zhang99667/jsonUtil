import {
  normalizeProductionAssetPath,
  normalizeRelativeProductionAssetPath,
} from './productionFrontendAssetPathNormalization.mjs';
import {
  extractJavascriptAssetCandidates,
  isDocumentExampleAssetPath,
} from './productionFrontendAssetJavascriptCandidates.mjs';

const addProductionAssetPath = (assetPaths, assetPath) =>
  assetPath && !isDocumentExampleAssetPath(assetPath) && assetPaths.add(assetPath);

export const extractFrontendAssetPathsFromJavascript = (javascript, currentAssetPath = '/assets/') => {
  const assetPaths = new Set();
  const candidates = extractJavascriptAssetCandidates(javascript);
  for (const assetString of candidates.assetStrings) {
    addProductionAssetPath(assetPaths, normalizeProductionAssetPath(assetString));
  }
  for (const relativeString of candidates.relativeStrings) {
    addProductionAssetPath(assetPaths, normalizeRelativeProductionAssetPath(relativeString, currentAssetPath));
  }
  for (const importMetaString of candidates.importMetaStrings) {
    addProductionAssetPath(
      assetPaths,
      normalizeProductionAssetPath(importMetaString) ||
        normalizeRelativeProductionAssetPath(importMetaString, currentAssetPath, true)
    );
  }
  return [...assetPaths];
};
