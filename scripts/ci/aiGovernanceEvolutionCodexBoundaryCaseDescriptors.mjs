import { AI_EVOLUTION_CODEX_CONTROLLER_BOUNDARY_CASES } from './aiGovernanceEvolutionCodexControllerBoundaryCaseDescriptors.mjs';
import { AI_EVOLUTION_CODEX_TRIAL_BOUNDARY_CASES } from './aiGovernanceEvolutionCodexTrialBoundaryCaseDescriptors.mjs';
import { mergeUniqueEvolutionCaseDescriptorGroups } from './aiGovernanceEvolutionCaseDescriptorRegistry.mjs';
import { AI_EVOLUTION_PROJECT_PLUGIN_BOUNDARY_CASES } from './aiGovernanceEvolutionProjectPluginBoundaryCaseDescriptors.mjs';

export const AI_EVOLUTION_CODEX_BOUNDARY_CASES = mergeUniqueEvolutionCaseDescriptorGroups(
  AI_EVOLUTION_CODEX_TRIAL_BOUNDARY_CASES,
  AI_EVOLUTION_CODEX_CONTROLLER_BOUNDARY_CASES,
  AI_EVOLUTION_PROJECT_PLUGIN_BOUNDARY_CASES,
);
