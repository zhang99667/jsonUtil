import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import { collectAiGovernanceAiSafetyEvidenceFailures } from './aiGovernanceAiSafetyEvidence.mjs';
import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import { collectAiGovernanceDecisionLedgerFailures } from './aiGovernanceDecisionLedger.mjs';
import { collectAiGovernanceExemptAssetContractFailures } from './aiGovernanceExemptAssetContract.mjs';
import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';
import { collectMcpConfigContractFailures } from './aiGovernanceMcpConfigContract.mjs';
import { collectAiGovernanceProjectFactFailures } from './aiGovernanceProjectFactsContract.mjs';
import { collectAiGovernanceScriptReachabilityFailures } from './aiGovernanceScriptReachability.mjs';
import { collectFrontendLintScriptFailures } from './aiGovernanceChecks.mjs';

const collectAssetRegistryContractFailures = (rootDir, context) => (
  collectAiGovernanceAssetRegistryFailures(rootDir, context.requiredFiles, context.referenceRules)
);

const CONTRACT_FAILURE_COLLECTORS = [
  collectAssetRegistryContractFailures,
  collectAiGovernanceCiContractFailures,
  collectAiGovernanceDecisionLedgerFailures,
  collectAiGovernanceExemptAssetContractFailures,
  collectAiGovernanceAiSafetyEvidenceFailures,
  collectAiGovernanceProjectFactFailures,
  collectAiGovernanceScriptReachabilityFailures,
  collectMcpConfigContractFailures,
  collectMirroredEntryContractFailures,
  collectFrontendLintScriptFailures,
];

export const collectAiGovernanceContractFailures = (rootDir, context) => (
  CONTRACT_FAILURE_COLLECTORS.flatMap(collector => collector(rootDir, context))
);
