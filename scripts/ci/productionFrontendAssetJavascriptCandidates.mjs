const DOCUMENT_EXAMPLE_ASSET_PATHS = new Set([
  '/assets/chunk.js',
  '/assets/theme.css',
  '/assets/worker.js',
]);

const matchCandidateValues = (javascript, pattern) =>
  [...javascript.matchAll(pattern)].map(match => match[1]);

export const isDocumentExampleAssetPath = (assetPath) =>
  assetPath.includes('*') || DOCUMENT_EXAMPLE_ASSET_PATHS.has(assetPath);

export const extractJavascriptAssetCandidates = (javascript) => ({
  assetStrings: matchCandidateValues(javascript, /["'`](\/?assets\/[^"'`]+)["'`]/g),
  relativeStrings: matchCandidateValues(javascript, /["'`](\.{1,2}\/[^"'`]+)["'`]/g),
  importMetaStrings: matchCandidateValues(
    javascript,
    /\bnew\s+URL\(\s*["'`]([^"'`]+)["'`]\s*,\s*import\.meta\.url\s*\)/g
  ),
});
