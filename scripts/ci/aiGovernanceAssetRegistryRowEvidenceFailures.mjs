import { collectUnknownGovernanceEvidenceMarkers, collectUnsupportedGovernanceEvidence, hasRecognizedGovernanceEvidence } from './aiGovernanceAssetRegistryEvidence.mjs';
import { collectMissingDiscoveredAssetSemanticEvidence } from './aiGovernanceAssetRegistrySemanticEvidence.mjs';

const prefix = file => `AI 资产登记 \`${file}\``;

export const buildRegistryRowEvidenceFailures = (file, row, evidenceContext) => {
  if (!row.type) return [`${prefix(file)} 缺少类型`];
  if (!row.contract) return [`${prefix(file)} 缺少维护契约`];
  if (!row.evidence) return [`${prefix(file)} 缺少治理证据`];
  if (!hasRecognizedGovernanceEvidence(row.evidence)) return [`${prefix(file)} 治理证据未命中认可标记`];

  const unknownMarkers = collectUnknownGovernanceEvidenceMarkers(row.evidence);
  if (unknownMarkers.length > 0) {
    return unknownMarkers.map(marker => `${prefix(file)} 治理证据包含未认可标记 \`${marker}\``);
  }

  return [
    ...collectUnsupportedGovernanceEvidence(file, row.evidence, evidenceContext)
      .map(marker => `${prefix(file)} 治理证据 \`${marker}\` 缺少实际来源支持`),
    ...collectMissingDiscoveredAssetSemanticEvidence(file, row.evidence, evidenceContext),
  ];
};
