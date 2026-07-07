import {
  AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS,
  splitEvidenceMarkers,
} from './aiGovernanceAssetRegistryEvidence.mjs';

const DISCOVERY_ONLY_EVIDENCE_MARKERS = ['自动发现规则', '资产发现规则'];

const hasNonDiscoveryEvidence = evidence => splitEvidenceMarkers(evidence)
  .some(marker => (
    AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS.includes(marker) &&
    !DISCOVERY_ONLY_EVIDENCE_MARKERS.includes(marker)
  ));

export const collectMissingDiscoveredAssetSemanticEvidence = (file, evidence, context) => (
  context.discoveredFiles.has(file) &&
  !context.exemptFiles.has(file) &&
  !hasNonDiscoveryEvidence(evidence)
    ? [`AI 资产登记 \`${file}\` 缺少发现规则以外的治理证据`]
    : []
);
