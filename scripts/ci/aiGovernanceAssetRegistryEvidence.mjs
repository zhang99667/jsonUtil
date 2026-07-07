import {
  EVIDENCE_SOURCE_CONTEXT_KEYS,
  EVIDENCE_SOURCE_DESCRIPTORS,
  splitEvidenceMarkers,
} from './aiGovernanceAssetRegistryEvidenceMarkers.mjs';

export {
  AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS,
  DISCOVERY_ONLY_EVIDENCE_MARKERS,
  EVIDENCE_SOURCE_CONTEXT_KEYS,
  EVIDENCE_SOURCE_DESCRIPTORS,
  FILE_REFERENCE_EVIDENCE_MARKERS,
  collectUnknownGovernanceEvidenceMarkers,
  hasRecognizedGovernanceEvidence,
  splitEvidenceMarkers,
} from './aiGovernanceAssetRegistryEvidenceMarkers.mjs';

const buildEvidenceSourceChecks = context => EVIDENCE_SOURCE_DESCRIPTORS
  .map(([marker, contextKey]) => ({ marker, files: context[contextKey] }));

export const collectMissingEvidenceSourceContextKeys = context => EVIDENCE_SOURCE_CONTEXT_KEYS
  .filter(contextKey => !(context[contextKey] instanceof Set));

export const collectUnsupportedGovernanceEvidence = (file, evidence, context) => {
  if (collectMissingEvidenceSourceContextKeys(context).length > 0) return [];

  const markers = splitEvidenceMarkers(evidence);
  return buildEvidenceSourceChecks(context)
    .filter(({ marker, files }) => markers.includes(marker) && !files.has(file))
    .map(({ marker }) => marker);
};
