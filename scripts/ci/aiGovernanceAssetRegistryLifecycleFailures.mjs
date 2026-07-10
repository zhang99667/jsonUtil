import { AI_GOVERNANCE_ASSET_REGISTRY_FILE } from './aiGovernanceAssetRegistryConstants.mjs';

export const buildDuplicateRegistryFailures = duplicateFiles => [...new Set(duplicateFiles)]
  .map(file => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 重复`);

export const buildStaleRegistryFailures = (registryRows, expectedRegistryFiles) => {
  const expectedFileSet = new Set(expectedRegistryFiles);
  return [...registryRows.keys()]
    .filter(file => !expectedFileSet.has(file))
    .map(file => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 已陈旧或未纳入治理集合`);
};
