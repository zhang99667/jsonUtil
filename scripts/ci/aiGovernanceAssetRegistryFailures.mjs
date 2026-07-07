import { AI_GOVERNANCE_ASSET_REGISTRY_FILE } from './aiGovernanceAssetRegistryConstants.mjs';
import { collectUnknownGovernanceEvidenceMarkers, collectUnsupportedGovernanceEvidence, hasRecognizedGovernanceEvidence } from './aiGovernanceAssetRegistryEvidence.mjs';

const buildDuplicateRegistryFailures = duplicateFiles => [...new Set(duplicateFiles)]
  .map(file => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 重复`);

const buildStaleRegistryFailures = (registryRows, expectedRegistryFiles) => {
  const expectedFileSet = new Set(expectedRegistryFiles);
  return [...registryRows.keys()]
    .filter(file => !expectedFileSet.has(file))
    .map(file => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 已陈旧或未纳入治理集合`);
};

const buildMissingRegistryFailures = (registryRows, evidenceContext) => (
  evidenceContext.expectedRegistryFiles.flatMap((file) => {
    const row = registryRows.get(file);
    if (!row) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: 缺少 AI 资产表格登记 \`${file}\``];
    if (!row.type) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 缺少类型`];
    if (!row.contract) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 缺少维护契约`];
    if (!row.evidence) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 缺少治理证据`];
    if (!hasRecognizedGovernanceEvidence(row.evidence)) {
      return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 治理证据未命中认可标记`];
    }
    const unknownMarkers = collectUnknownGovernanceEvidenceMarkers(row.evidence);
    if (unknownMarkers.length > 0) return unknownMarkers.map(marker => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 治理证据包含未认可标记 \`${marker}\``);
    return collectUnsupportedGovernanceEvidence(file, row.evidence, evidenceContext)
      .map(marker => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 治理证据 \`${marker}\` 缺少实际来源支持`);
  })
);

export const buildAiGovernanceAssetRegistryFailures = ({ duplicateFiles, evidenceContext, registryRows }) => [
  ...buildDuplicateRegistryFailures(duplicateFiles),
  ...buildStaleRegistryFailures(registryRows, evidenceContext.expectedRegistryFiles),
  ...buildMissingRegistryFailures(registryRows, evidenceContext),
];
