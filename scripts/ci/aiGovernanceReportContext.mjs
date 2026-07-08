import { discoverCodexSkillFiles } from './aiGovernanceChecks.mjs';
import { buildGovernedAiGovernanceAssetFiles } from './aiGovernanceDiscoveredAssets.mjs';
import { buildAiGovernanceReferenceRules, buildAiGovernanceRequiredFiles } from './aiGovernanceRules.mjs';

export const buildAiGovernanceReportContext = (rootDir) => {
  const codexSkillFiles = discoverCodexSkillFiles(rootDir);
  const requiredFiles = buildAiGovernanceRequiredFiles(codexSkillFiles);
  const referenceRules = buildAiGovernanceReferenceRules(codexSkillFiles);
  const governedFiles = buildGovernedAiGovernanceAssetFiles(requiredFiles, referenceRules);

  return { codexSkillFiles, requiredFiles, referenceRules, governedFiles };
};
