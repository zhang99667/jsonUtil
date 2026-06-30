const IMPORT_META_ASSET_EXTENSION_PATTERN = /\.(?:js|css|wasm|json|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$/i;

export const normalizeProductionBaseUrl = (value) => {
  const normalized = String(value || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/]+/i.test(normalized)) {
    throw new Error(`公网地址必须是 http(s) URL: ${value}`);
  }
  return normalized;
};

export const normalizeProductionAssetPath = (value) => {
  const cleanValue = value.split(/[?#]/)[0];
  const assetPath = cleanValue.startsWith('/') ? cleanValue : `/${cleanValue}`;
  return assetPath.startsWith('/assets/') ? assetPath : null;
};

export const normalizeRelativeProductionAssetPath = (
  value,
  currentAssetPath,
  allowBare = false
) => {
  const cleanValue = value.split(/[?#]/)[0];
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(cleanValue)) return null;
  const isRelative = cleanValue.startsWith('./') || cleanValue.startsWith('../');
  if (!isRelative && (!allowBare || !IMPORT_META_ASSET_EXTENSION_PATTERN.test(cleanValue))) return null;

  const currentPath = currentAssetPath || '/assets/';
  const assetPath = new URL(cleanValue, `https://jsonutils.local${currentPath}`).pathname;
  return assetPath.startsWith('/assets/') ? assetPath : null;
};

export const isProductionFrontendJavascriptAsset = (assetPath) => /^\/assets\/.+\.js$/i.test(assetPath);
