import { AI_GOVERNANCE_ASSET_REGISTRY_FILE } from './aiGovernanceAssetRegistryConstants.mjs';
import { collectMissingEvidenceSourceContextKeys } from './aiGovernanceAssetRegistryEvidence.mjs';
import { buildRegistryRowEvidenceFailures } from './aiGovernanceAssetRegistryRowEvidenceFailures.mjs';

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
    return buildRegistryRowEvidenceFailures(file, row, evidenceContext)
      .map(failure => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: ${failure}`);
  })
);

const buildEvidenceSourceContextFailures = evidenceContext => collectMissingEvidenceSourceContextKeys(evidenceContext)
  .map(contextKey => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产注册表证据来源集合缺少 \`${contextKey}\``);

export const buildAiGovernanceAssetRegistryFailures = ({ duplicateFiles, evidenceContext, registryRows }) => {
  const evidenceSourceContextFailures = buildEvidenceSourceContextFailures(evidenceContext);
  return [
    ...buildDuplicateRegistryFailures(duplicateFiles),
    ...buildStaleRegistryFailures(registryRows, evidenceContext.expectedRegistryFiles),
    ...evidenceSourceContextFailures,
    ...(evidenceSourceContextFailures.length > 0 ? [] : buildMissingRegistryFailures(registryRows, evidenceContext)),
  ];
};
