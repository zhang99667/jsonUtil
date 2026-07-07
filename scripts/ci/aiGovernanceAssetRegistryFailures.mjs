import { AI_GOVERNANCE_ASSET_REGISTRY_FILE } from './aiGovernanceAssetRegistryConstants.mjs';

const buildDuplicateRegistryFailures = duplicateFiles => [...new Set(duplicateFiles)]
  .map(file => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 重复`);

const buildStaleRegistryFailures = (registryRows, expectedRegistryFiles) => {
  const expectedFileSet = new Set(expectedRegistryFiles);
  return [...registryRows.keys()]
    .filter(file => !expectedFileSet.has(file))
    .map(file => `${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 已陈旧或未纳入治理集合`);
};

const buildMissingRegistryFailures = (registryRows, expectedRegistryFiles) => (
  expectedRegistryFiles.flatMap((file) => {
    const row = registryRows.get(file);
    if (!row) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: 缺少 AI 资产表格登记 \`${file}\``];
    if (!row.type) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 缺少类型`];
    if (!row.contract) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 缺少维护契约`];
    if (!row.evidence) return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: AI 资产登记 \`${file}\` 缺少治理证据`];
    return [];
  })
);

export const buildAiGovernanceAssetRegistryFailures = ({
  duplicateFiles,
  expectedRegistryFiles,
  registryRows,
}) => [
  ...buildDuplicateRegistryFailures(duplicateFiles),
  ...buildStaleRegistryFailures(registryRows, expectedRegistryFiles),
  ...buildMissingRegistryFailures(registryRows, expectedRegistryFiles),
];
