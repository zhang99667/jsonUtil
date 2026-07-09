import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import { collectUngovernedAiGovernanceAssets } from './aiGovernanceDiscoveredAssets.mjs';
import { collectAiGovernanceExemptAssetContractFailures } from './aiGovernanceExemptAssetContract.mjs';
import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';
import { collectAiGovernanceProjectFactFailures } from './aiGovernanceProjectFactsContract.mjs';
import {
  collectFrontendLintScriptFailures,
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

export const collectAiGovernanceReferenceFailures = (rootDir, context) => [
  ...collectAiGovernanceAssetRegistryFailures(
    rootDir,
    context.requiredFiles,
    context.referenceRules,
  ),
  ...collectAiGovernanceCiContractFailures(rootDir),
  ...collectAiGovernanceDecisionLedgerFailures(rootDir),
  ...collectAiGovernanceExemptAssetContractFailures(rootDir),
  ...collectAiGovernanceProjectFactFailures(rootDir),
  ...collectMissingAiGovernanceReferences(rootDir, context.referenceRules, context.codexSkillFiles),
  ...collectMirroredEntryContractFailures(rootDir),
  ...collectFrontendLintScriptFailures(rootDir),
];
