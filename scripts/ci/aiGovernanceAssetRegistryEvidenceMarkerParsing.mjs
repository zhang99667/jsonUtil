import { AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS } from './aiGovernanceAssetRegistryEvidenceMarkerGroups.mjs';

export const splitEvidenceMarkers = evidence => evidence
  .split(/[、，,；;|]/)
  .map(marker => marker.trim())
  .filter(Boolean);

export const hasRecognizedGovernanceEvidence = evidence => splitEvidenceMarkers(evidence)
  .some(marker => AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS.includes(marker));

export const collectUnknownGovernanceEvidenceMarkers = evidence => splitEvidenceMarkers(evidence)
  .filter(marker => !AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS.includes(marker));
