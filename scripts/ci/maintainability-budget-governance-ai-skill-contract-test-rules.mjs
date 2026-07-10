import { governanceAiSkillContractTestCoreMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-test-core-rules.mjs';
import { governanceAiSkillFrontmatterTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-frontmatter-test-rules.mjs';

export const governanceAiSkillContractTestMaintainabilityBudgets = [
  ...governanceAiSkillContractTestCoreMaintainabilityBudgets,
  ...governanceAiSkillFrontmatterTestMaintainabilityBudgets,
];
