import { governanceAiMcpConfigContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-config-contract-test-rules.mjs';
import { governanceAiMcpConfigRuntimeTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-config-runtime-test-rules.mjs';
import { governanceAiMcpServerTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-server-test-rules.mjs';

const mcpContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpContractTestMaintainabilityBudgets = [
  mcpContractTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-contract-test-rules.mjs', 15, 'AI 治理 MCP 契约测试预算子表应只组合 MCP 配置、runtime 和 server/stdio 测试预算子表'),
  ...governanceAiMcpConfigContractTestMaintainabilityBudgets,
  ...governanceAiMcpConfigRuntimeTestMaintainabilityBudgets,
  ...governanceAiMcpServerTestMaintainabilityBudgets,
];
