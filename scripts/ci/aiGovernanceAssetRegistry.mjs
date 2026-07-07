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

const buildRegistryEvidenceContext = (rootDir, requiredFiles, referenceRules) => {
  const discoveredFiles = discoverAiGovernanceAssetFiles(rootDir);
  const exemptFiles = AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES.filter(file => hasFile(rootDir, file));
  return {
    discoveredFiles: new Set(discoveredFiles),
    exemptFiles: new Set(exemptFiles),
    expectedRegistryFiles: uniqueSorted([...requiredFiles, ...discoveredFiles, ...exemptFiles]),
    referenceRuleFiles: new Set(referenceRules.map(rule => rule.file)),
    requiredFiles: new Set(requiredFiles),
  };
};

export const collectAiGovernanceAssetRegistryFailures = (rootDir, requiredFiles, referenceRules = []) => {
  const registryPath = path.join(rootDir, AI_GOVERNANCE_ASSET_REGISTRY_FILE);
  if (!fs.existsSync(registryPath)) {
    return [`${AI_GOVERNANCE_ASSET_REGISTRY_FILE}: 文件不存在，无法检查 AI 资产注册表`];
  }

  const { rows: registryRows, duplicateFiles } = parseAiGovernanceAssetRegistryRows(
    fs.readFileSync(registryPath, 'utf8')
  );
  const evidenceContext = buildRegistryEvidenceContext(rootDir, requiredFiles, referenceRules);

  return buildAiGovernanceAssetRegistryFailures({
    duplicateFiles,
    evidenceContext,
    registryRows,
  });
};
