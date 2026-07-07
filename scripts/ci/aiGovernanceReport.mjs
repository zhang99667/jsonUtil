import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import {
  buildGovernedAiGovernanceAssetFiles,
  collectUngovernedAiGovernanceAssets,
} from './aiGovernanceDiscoveredAssets.mjs';
import { collectAiGovernanceExemptAssetContractFailures } from './aiGovernanceExemptAssetContract.mjs';
import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';
import {
  collectFrontendLintScriptFailures,
  collectMissingAiGovernanceFiles,
  collectMissingAiGovernanceReferences,
  discoverCodexSkillFiles,
} from './aiGovernanceChecks.mjs';
import { buildAiGovernanceReferenceRules, buildAiGovernanceRequiredFiles } from './aiGovernanceRules.mjs';

export const buildAiGovernanceReport = (rootDir) => {
  const codexSkillFiles = discoverCodexSkillFiles(rootDir);
  const requiredFiles = buildAiGovernanceRequiredFiles(codexSkillFiles);
  const referenceRules = buildAiGovernanceReferenceRules(codexSkillFiles);
  const governedFiles = buildGovernedAiGovernanceAssetFiles(requiredFiles, referenceRules);

  return {
    requiredFiles,
    referenceRules,
    missingFiles: [
      ...collectMissingAiGovernanceFiles(rootDir, requiredFiles),
      ...collectUngovernedAiGovernanceAssets(rootDir, governedFiles),
    ],
    skillContractFailures: collectCodexSkillContractFailures(rootDir, codexSkillFiles),
    missingReferences: [
      ...collectAiGovernanceAssetRegistryFailures(rootDir, requiredFiles, referenceRules),
      ...collectAiGovernanceCiContractFailures(rootDir),
      ...collectAiGovernanceDecisionLedgerFailures(rootDir),
      ...collectAiGovernanceExemptAssetContractFailures(rootDir),
      ...collectMissingAiGovernanceReferences(rootDir, referenceRules, codexSkillFiles),
      ...collectMirroredEntryContractFailures(rootDir),
      ...collectFrontendLintScriptFailures(rootDir),
    ],
  };
};
