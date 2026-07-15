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

export const collectAiGovernanceEvolutionEvidenceFailures = (_, context) => [
  ...(context.evolutionEvalReport.currentRunFailures ?? []),
  ...(context.evolutionEvalReport.evidenceFreshness?.failures ?? []),
].map(failure => `AI evolution evidence: ${failure}`);

export { collectAiGovernanceContractFailures };

export const collectAiGovernanceReferenceFailures = (rootDir, context) => (
  collectMissingAiGovernanceReferences(rootDir, context.referenceRules, context.codexSkillFiles)
);

export const buildAiGovernanceFailureGroups = (rootDir, context) => ({
  missingFiles: collectAiGovernanceMissingFileFailures(rootDir, context),
  skillContractFailures: collectAiGovernanceSkillContractFailures(rootDir, context),
  contractFailures: collectAiGovernanceContractFailures(rootDir, context),
  evolutionEvidenceFailures: collectAiGovernanceEvolutionEvidenceFailures(rootDir, context),
  missingReferences: collectAiGovernanceReferenceFailures(rootDir, context),
});
