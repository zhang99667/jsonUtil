import { AI_EVOLUTION_CLAUDE_SKILL_ADAPTER_CASES } from './aiGovernanceClaudeSkillAdapterCaseDescriptors.mjs';
import { AI_EVOLUTION_CODEX_AGENT_CASES } from './aiGovernanceCodexAgentCaseDescriptors.mjs';
import { AI_EVOLUTION_CODEX_BOUNDARY_CASES } from './aiGovernanceEvolutionCodexBoundaryCaseDescriptors.mjs';
import { AI_EVOLUTION_CODEX_COMMAND_RULE_CASES } from './aiGovernanceCodexCommandRuleCaseDescriptors.mjs';
import { AI_EVOLUTION_CODEX_HOOK_CASES } from './aiGovernanceCodexHookCaseDescriptors.mjs';
import { AI_EVOLUTION_CODEX_ATTESTED_CONTROLLER_CASES } from './aiGovernanceCodexExternalControllerAttestedCaseDescriptors.mjs';
import { mergeUniqueEvolutionCaseDescriptorGroups } from './aiGovernanceEvolutionCaseDescriptorRegistry.mjs';
import { AI_EVOLUTION_REGISTRATION_CANARY_CASES } from './aiGovernanceRegistrationCanaryCaseDescriptors.mjs';

export const AI_EVOLUTION_CODEX_CASES = mergeUniqueEvolutionCaseDescriptorGroups(
  AI_EVOLUTION_CLAUDE_SKILL_ADAPTER_CASES,
  AI_EVOLUTION_CODEX_AGENT_CASES,
  AI_EVOLUTION_CODEX_COMMAND_RULE_CASES,
  AI_EVOLUTION_CODEX_HOOK_CASES,
  AI_EVOLUTION_CODEX_ATTESTED_CONTROLLER_CASES,
  AI_EVOLUTION_REGISTRATION_CANARY_CASES,
  AI_EVOLUTION_CODEX_BOUNDARY_CASES,
);
