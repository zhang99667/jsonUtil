import { AI_GOVERNANCE_ASSET_REGISTRY_FILE } from './aiGovernanceAssetRegistryConstants.mjs';
import { collectMissingEvidenceSourceContextKeys } from './aiGovernanceAssetRegistryEvidence.mjs';
import { buildRegistryRowEvidenceFailures } from './aiGovernanceAssetRegistryRowEvidenceFailures.mjs';

export const buildMissingRegistryFailures = (registryRows, evidenceContext) => (
  evidenceContext.expectedRegistryFiles.flatMap((file) => {
    const row = registryRows.get(file);
    if (!row) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: 缺少 AI 资产表格登记 \`${file}\``];
    return buildRegistryRowEvidenceFailures(file, row, evidenceContext)
      .map(failure => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: ${failure}`);
  })
);

export const buildEvidenceSourceContextFailures = evidenceContext => collectMissingEvidenceSourceContextKeys(evidenceContext)
  .map(contextKey => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产注册表证据来源集合缺少 \`${contextKey}\``);

export const buildRegistryCoverageFailures = (registryRows, evidenceContext) => {
  const evidenceSourceContextFailures = buildEvidenceSourceContextFailures(evidenceContext);
  return evidenceSourceContextFailures.length > 0 ? evidenceSourceContextFailures : buildMissingRegistryFailures(registryRows, evidenceContext);
};
