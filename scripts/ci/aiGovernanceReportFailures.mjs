import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { collectAiGovernanceContractFailures } from './aiGovernanceContractFailures.mjs';
import { collectUngovernedAiGovernanceAssets } from './aiGovernanceDiscoveredAssets.mjs';
import {
  collectMissingAiGovernanceFiles,
  collectMissingAiGovernanceReferences,
} from './aiGovernanceChecks.mjs';

export const collectAiGovernanceMissingFileFailures = (rootDir, context) => [
  ...collectMissingAiGovernanceFiles(rootDir, context.requiredFiles),
  ...collectUngovernedAiGovernanceAssets(rootDir, context.governedFiles),
];

export const collectAiGovernanceSkillContractFailures = (rootDir, context) => (
  collectCodexSkillContractFailures(rootDir, context.codexSkillFiles)
);

export { collectAiGovernanceContractFailures };

export const collectAiGovernanceReferenceFailures = (rootDir, context) => (
  collectMissingAiGovernanceReferences(rootDir, context.referenceRules, context.codexSkillFiles)
);
