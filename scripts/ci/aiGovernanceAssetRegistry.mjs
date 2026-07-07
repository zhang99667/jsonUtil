import fs from 'node:fs';
import path from 'node:path';
import {
  AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES,
  discoverAiGovernanceAssetFiles,
} from './aiGovernanceDiscoveredAssets.mjs';
import { AI_GOVERNANCE_ASSET_REGISTRY_FILE } from './aiGovernanceAssetRegistryConstants.mjs';
import { buildAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistryFailures.mjs';
import { parseAiGovernanceAssetRegistryRows } from './aiGovernanceAssetRegistryRows.mjs';

const hasFile = (rootDir, file) => fs.existsSync(path.join(rootDir, file));

const uniqueSorted = files => [...new Set(files)].sort();

const buildExpectedRegistryFiles = (rootDir, requiredFiles) => uniqueSorted([
  ...requiredFiles,
  ...discoverAiGovernanceAssetFiles(rootDir),
  ...AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES.filter(file => hasFile(rootDir, file)),
]);

export const collectAiGovernanceAssetRegistryFailures = (rootDir, requiredFiles) => {
  const registryPath = path.join(rootDir, AI_GOVERNANCE_ASSET_REGISTRY_FILE);
  if (!fs.existsSync(registryPath)) {
    return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: 文件不存在，无法检查 AI 资产注册表`];
  }

  const { rows: registryRows, duplicateFiles } = parseAiGovernanceAssetRegistryRows(
    fs.readFileSync(registryPath, 'utf8')
  );
  const expectedRegistryFiles = buildExpectedRegistryFiles(rootDir, requiredFiles);

  return buildAiGovernanceAssetRegistryFailures({
    duplicateFiles,
    expectedRegistryFiles,
    registryRows,
  });
};
