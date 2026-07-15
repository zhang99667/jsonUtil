import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import { collectAiGovernanceAiSafetyEvidenceFailures } from './aiGovernanceAiSafetyEvidence.mjs';
import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import { collectCodexAgentProfileFailures } from './aiGovernanceCodexAgentProfiles.mjs';
import { collectCodexHookFailures } from './aiGovernanceCodexHooks.mjs';
import { collectCodexSkillSourceContractFailures } from './aiGovernanceCodexSkillSourceContract.mjs';
import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import { collectAiGovernanceExemptAssetContractFailures } from './aiGovernanceExemptAssetContract.mjs';
import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';
import { collectMcpConfigContractFailures } from './aiGovernanceMcpConfigContract.mjs';
import { collectAiGovernanceProjectFactFailures } from './aiGovernanceProjectFactsContract.mjs';
import { collectProjectPluginFailures } from './aiGovernanceProjectPlugins.mjs';
import { collectAiGovernanceScheduledWorkflowFailures } from './aiGovernanceScheduledWorkflowContract.mjs';
import { collectAiGovernanceScriptReachabilityFailures } from './aiGovernanceScriptReachability.mjs';
import { collectFrontendLintScriptFailures } from './aiGovernanceChecks.mjs';

const collectAssetRegistryContractFailures = (rootDir, context) => (
  collectAiGovernanceAssetRegistryFailures(rootDir, context.requiredFiles, context.referenceRules)
);
const collectEvolutionEvalContractFailures = (_, context) => context.evolutionEvalReport.failures
  .map(failure => `AI evolution eval: ${failure}`);

const CONTRACT_FAILURE_COLLECTORS = [
  collectAssetRegistryContractFailures,
  collectAiGovernanceCiContractFailures,
  collectCodexAgentProfileFailures,
  collectCodexHookFailures,
  collectCodexSkillSourceContractFailures,
  collectAiGovernanceDecisionLedgerFailures,
  collectEvolutionEvalContractFailures,
  collectAiGovernanceExemptAssetContractFailures,
  collectAiGovernanceAiSafetyEvidenceFailures,
  collectAiGovernanceProjectFactFailures,
  collectProjectPluginFailures,
  collectAiGovernanceScheduledWorkflowFailures,
  collectAiGovernanceScriptReachabilityFailures,
  collectMcpConfigContractFailures,
  collectMirroredEntryContractFailures,
  collectFrontendLintScriptFailures,
];

export const collectAiGovernanceContractFailures = (rootDir, context) => (
  CONTRACT_FAILURE_COLLECTORS.flatMap(collector => collector(rootDir, context))
);
