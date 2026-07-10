import { governanceAiMcpConfigMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-config-rules.mjs';
import { governanceAiMcpRuntimeMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-runtime-rules.mjs';

export const governanceAiMcpContractMaintainabilityBudgets = [
  ...governanceAiMcpConfigMaintainabilityBudgets,
  ...governanceAiMcpRuntimeMaintainabilityBudgets,
];
