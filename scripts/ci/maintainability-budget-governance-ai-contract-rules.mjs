import { governanceAiAutomationContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-automation-contract-rules.mjs';
import { governanceAiEntryContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-entry-contract-rules.mjs';
import { governanceAiMcpContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-contract-rules.mjs';
import { governanceAiProjectContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-project-contract-rules.mjs';
import { governanceAiSkillContractMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-contract-rules.mjs';
const governanceAiContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiContractMaintainabilityBudgets = [
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-contract-rules.mjs', 20, 'AI 治理契约预算规则应只组合自动化、入口、MCP、项目事实和 skill 契约子表'),
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-skill-contract-rules.mjs', 20, 'AI 治理 skill 契约预算子表应只组合 Codex skill 内容、结构、引用、章节和命令契约预算'),
  ...governanceAiAutomationContractMaintainabilityBudgets,
  ...governanceAiEntryContractMaintainabilityBudgets,
  ...governanceAiMcpContractMaintainabilityBudgets,
  ...governanceAiProjectContractMaintainabilityBudgets,
  ...governanceAiSkillContractMaintainabilityBudgets,
];
