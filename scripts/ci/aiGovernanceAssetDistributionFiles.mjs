import { discoverAiGovernanceAssetFiles } from './aiGovernanceDiscoveredAssets.mjs';
import { discoverAiGovernanceImplementationFiles } from './aiGovernanceImplementationFiles.mjs';

export {
  AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES,
  discoverAiGovernanceImplementationFiles,
} from './aiGovernanceImplementationFiles.mjs';

export const buildAiGovernanceDistributionAssetFiles = ({
  rootDir,
  requiredFiles,
  referenceRules,
}) => [...new Set([
  ...requiredFiles,
  ...referenceRules.map(rule => rule.file),
  ...discoverAiGovernanceAssetFiles(rootDir),
  ...discoverAiGovernanceImplementationFiles(rootDir),
])].sort();
