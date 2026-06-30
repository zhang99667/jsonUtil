import { extractFrontendAssetPathsFromJavascript } from './productionFrontendAssetJavascriptPaths.mjs';
import { extractFrontendAssetPathsFromCss } from './productionFrontendAssetCssPaths.mjs';
import { addDiscoveredFrontendAsset } from './productionFrontendAssetDiscoveryQueue.mjs';
import { fetchProductionAssetText } from './productionFrontendAssetRequests.mjs';

const collectFailure = (failures, assetPath, error) => {
  const message = error instanceof Error ? error.message : String(error);
  failures.add(`${assetPath}: ${message}`);
};

const scanAssetQueue = async (normalizedBaseUrl, pendingAssets, failures, extractNestedAssets) => {
  const scannedAssets = [];
  const scannedAssetSet = new Set();

  while (pendingAssets.length > 0) {
    const assetPath = pendingAssets.shift();
    if (!assetPath || scannedAssetSet.has(assetPath)) continue;

    scannedAssetSet.add(assetPath);
    scannedAssets.push(assetPath);
    try {
      const assetText = await fetchProductionAssetText(`${normalizedBaseUrl}${assetPath}`);
      extractNestedAssets(assetText, assetPath);
    } catch (error) {
      collectFailure(failures, assetPath, error);
    }
  }

  return scannedAssets;
};

export const scanProductionFrontendAssets = async (normalizedBaseUrl, assetPaths, pendingJavascript, pendingCss, failures) => {
  const scannedJavascript = [];
  const scannedCss = [];
  const addAsset = assetPath => addDiscoveredFrontendAsset(assetPaths, pendingJavascript, pendingCss, assetPath);

  while (pendingJavascript.length > 0 || pendingCss.length > 0) {
    scannedJavascript.push(...await scanAssetQueue(
      normalizedBaseUrl,
      pendingJavascript,
      failures,
      (javascript, assetPath) => extractFrontendAssetPathsFromJavascript(javascript, assetPath).forEach(addAsset)
    ));
    scannedCss.push(...await scanAssetQueue(
      normalizedBaseUrl,
      pendingCss,
      failures,
      (css, assetPath) => extractFrontendAssetPathsFromCss(css, assetPath).forEach(addAsset)
    ));
  }

  return { scannedJavascript, scannedCss };
};
