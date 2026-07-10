import { EVIDENCE_SOURCE_DESCRIPTORS } from './aiGovernanceAssetRegistryEvidenceSourceDescriptors.mjs';

export const EVIDENCE_SOURCE_CONTEXT_KEYS = [...new Set(EVIDENCE_SOURCE_DESCRIPTORS.map(([, contextKey]) => contextKey))];

const markersForContext = contextKey => EVIDENCE_SOURCE_DESCRIPTORS
  .filter(([, descriptorContextKey]) => descriptorContextKey === contextKey)
  .map(([marker]) => marker);

export const DISCOVERY_ONLY_EVIDENCE_MARKERS = markersForContext('discoveredFiles');
export const FILE_REFERENCE_EVIDENCE_MARKERS = markersForContext('referenceRuleFiles');
export const AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS = EVIDENCE_SOURCE_DESCRIPTORS.map(([marker]) => marker);
