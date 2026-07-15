import { governanceAiAgentProfileMaintainabilityBudgets } from './maintainability-budget-governance-ai-agent-profile-rules.mjs';
import { governanceAiAutomationContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-automation-contract-rules.mjs';
import { governanceAiCommandRuleContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-command-rule-contract-rules.mjs';
import { governanceAiEntryContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-entry-contract-rules.mjs';
import { governanceAiHookContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-hook-contract-rules.mjs';
import { governanceAiMcpContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-contract-rules.mjs';
import { governanceAiProjectContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-project-contract-rules.mjs';
import { governanceAiSkillContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-rules.mjs';
const governanceAiContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiContractMaintainabilityBudgets = [
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-contract-rules.mjs', 22, 'AI 治理契约预算规则应只组合 command rules、自动化、入口、MCP、项目事实和 skill 契约子表'),
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-skill-contract-rules.mjs', 35, 'AI 治理 skill 契约预算子表应只组合 canonical skill 与 Claude adapter 的结构、引用、上下文和命令契约'),
  ...governanceAiAgentProfileMaintainabilityBudgets,
  ...governanceAiAutomationContractMaintainabilityBudgets,
  ...governanceAiCommandRuleContractMaintainabilityBudgets,
  ...governanceAiEntryContractMaintainabilityBudgets,
  ...governanceAiHookContractMaintainabilityBudgets,
  ...governanceAiMcpContractMaintainabilityBudgets,
  ...governanceAiProjectContractMaintainabilityBudgets,
  ...governanceAiSkillContractMaintainabilityBudgets,
];
