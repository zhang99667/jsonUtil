import { extractJavascriptAssetCandidates } from './productionFrontendAssetJavascriptCandidates.mjs';
import { resolveJavascriptAssetCandidatePaths } from './productionFrontendAssetJavascriptPathResolvers.mjs';

export const extractFrontendAssetPathsFromJavascript = (javascript, currentAssetPath = '/assets/') => {
  const candidates = extractJavascriptAssetCandidates(javascript);
  return resolveJavascriptAssetCandidatePaths(candidates, currentAssetPath);
};
