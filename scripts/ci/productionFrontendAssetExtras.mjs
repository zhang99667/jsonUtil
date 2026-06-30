import { normalizeProductionAssetPath } from './productionFrontendAssetPathNormalization.mjs';

const normalizeListedAssetPath = (value) => {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return null;
  if (/^https?:\/\//i.test(cleanValue)) {
    try {
      return normalizeProductionAssetPath(new URL(cleanValue).pathname);
    } catch {
      return null;
    }
  }
  return normalizeProductionAssetPath(cleanValue);
};

export const parseProductionAssetPathList = (rawPaths) => (
  [...new Set(String(rawPaths || '')
    .split(/[,\n]/)
    .map(normalizeListedAssetPath)
    .filter(Boolean))]
);

export const getExtraProductionAssetPathsFromEnv = () => (
  parseProductionAssetPathList(process.env.FRONTEND_ASSET_VERIFY_EXTRA_PATHS)
);
