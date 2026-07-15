import { collectCodexAgentProfileFailures } from './aiGovernanceCodexAgentProfiles.mjs';
import { collectCodexCommandRuleFailures } from './aiGovernanceCodexCommandRules.mjs';
import { collectCodexHookFailures } from './aiGovernanceCodexHooks.mjs';
import { collectCodexProjectMcpConfigFailures } from './aiGovernanceCodexProjectMcpConfig.mjs';
import { collectCodexSkillSourceContractFailures } from './aiGovernanceCodexSkillSourceContract.mjs';

const CODEX_PROJECT_CONTRACT_FAILURE_COLLECTORS = [
  collectCodexAgentProfileFailures,
  collectCodexCommandRuleFailures,
  collectCodexHookFailures,
  collectCodexProjectMcpConfigFailures,
  collectCodexSkillSourceContractFailures,
];

export const collectCodexProjectContractFailures = rootDir => (
  CODEX_PROJECT_CONTRACT_FAILURE_COLLECTORS.flatMap(collector => collector(rootDir))
);
