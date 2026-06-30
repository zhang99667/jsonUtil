import {
  normalizeProductionAssetPath,
  normalizeRelativeProductionAssetPath,
} from './productionFrontendAssetPathNormalization.mjs';
import { isDocumentExampleAssetPath } from './productionFrontendAssetJavascriptCandidates.mjs';

const addResolvedAssetPath = (assetPaths, assetPath) => {
  if (assetPath && !isDocumentExampleAssetPath(assetPath)) {
    assetPaths.add(assetPath);
  }
};

const normalizeImportMetaAssetPath = (assetPath, currentAssetPath) => (
  normalizeProductionAssetPath(assetPath) ||
  normalizeRelativeProductionAssetPath(assetPath, currentAssetPath, true)
);

export const resolveJavascriptAssetCandidatePaths = (candidates, currentAssetPath = '/assets/') => {
  const assetPaths = new Set();
  for (const assetString of candidates.assetStrings) {
    addResolvedAssetPath(assetPaths, normalizeProductionAssetPath(assetString));
  }
  for (const relativeString of candidates.relativeStrings) {
    addResolvedAssetPath(assetPaths, normalizeRelativeProductionAssetPath(relativeString, currentAssetPath));
  }
  for (const importMetaString of candidates.importMetaStrings) {
    addResolvedAssetPath(assetPaths, normalizeImportMetaAssetPath(importMetaString, currentAssetPath));
  }
  return [...assetPaths];
};
