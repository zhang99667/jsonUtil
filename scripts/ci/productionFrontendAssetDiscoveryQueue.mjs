import { isProductionFrontendCssAsset } from './productionFrontendAssetCssPaths.mjs';
import { isProductionFrontendJavascriptAsset } from './productionFrontendAssetPathNormalization.mjs';

const addDiscoveredProductionAsset = (assetPaths, pendingJavascript, assetPath) => {
  if (!assetPath || assetPaths.has(assetPath)) return;
  assetPaths.add(assetPath);
  if (isProductionFrontendJavascriptAsset(assetPath)) pendingJavascript.push(assetPath);
};

export const addDiscoveredFrontendAsset = (assetPaths, pendingJavascript, pendingCss, assetPath) => {
  const wasKnown = !assetPath || assetPaths.has(assetPath);
  addDiscoveredProductionAsset(assetPaths, pendingJavascript, assetPath);
  if (!wasKnown && isProductionFrontendCssAsset(assetPath)) pendingCss.push(assetPath);
};
