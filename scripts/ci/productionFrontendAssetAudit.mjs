import {
  extractFrontendAssetPathsFromHtml,
  getProductionAssetPagesFromEnv,
} from './productionFrontendAssetPaths.mjs';
import { normalizeProductionBaseUrl } from './productionFrontendAssetPathNormalization.mjs';
import { getExtraProductionAssetPathsFromEnv } from './productionFrontendAssetExtras.mjs';
import { addDiscoveredFrontendAsset } from './productionFrontendAssetDiscoveryQueue.mjs';
import { scanProductionFrontendAssets } from './productionFrontendAssetScanners.mjs';
import {
  checkProductionAsset,
  fetchProductionAssetText,
} from './productionFrontendAssetRequests.mjs';

const checkDiscoveredAssets = async (normalizedBaseUrl, assetPaths, failures) => {
  await Promise.all([...assetPaths].map(async (assetPath) => {
    try {
      await checkProductionAsset(`${normalizedBaseUrl}${assetPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.add(`${assetPath}: ${message}`);
    }
  }));
};

export const buildProductionFrontendAssetAudit = async (
  baseUrl,
  pages = getProductionAssetPagesFromEnv(),
  extraAssetPaths = getExtraProductionAssetPathsFromEnv()
) => {
  const normalizedBaseUrl = normalizeProductionBaseUrl(baseUrl);
  const assetPaths = new Set();
  const pendingJavascript = [];
  const pendingCss = [];
  const failures = new Set();
  const addAsset = assetPath => addDiscoveredFrontendAsset(
    assetPaths,
    pendingJavascript,
    pendingCss,
    assetPath
  );

  extraAssetPaths.forEach(addAsset);

  for (const page of pages) {
    const pagePath = page.startsWith('/') ? page : `/${page}`;
    try {
      const html = await fetchProductionAssetText(`${normalizedBaseUrl}${pagePath}`);
      extractFrontendAssetPathsFromHtml(html).forEach(addAsset);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.add(`${pagePath}: ${message}`);
    }
  }

  const { scannedJavascript, scannedCss } = await scanProductionFrontendAssets(
    normalizedBaseUrl,
    assetPaths,
    pendingJavascript,
    pendingCss,
    failures
  );
  await checkDiscoveredAssets(normalizedBaseUrl, assetPaths, failures);

  return {
    baseUrl: normalizedBaseUrl,
    pages,
    assetPaths: [...assetPaths].sort(),
    scannedJavascript,
    scannedCss,
    failures: [...failures].sort(),
  };
};
