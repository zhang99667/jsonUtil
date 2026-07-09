const mcpContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpContractMaintainabilityBudgets = [
  mcpContractBudget('scripts/ci/maintainability-budget-governance-ai-mcp-contract-rules.mjs', 10, 'AI 治理 MCP 契约预算子表应只维护 MCP 配置和运行时契约条目'),
  mcpContractBudget('scripts/ci/aiGovernanceMcpConfigContract.mjs', 80, 'AI 治理 MCP 配置契约应只维护项目级 MCP JSON 结构和敏感字段边界'),
  mcpContractBudget('scripts/ci/aiGovernanceMcpConfigRuntimeContract.mjs', 55, 'AI 治理 MCP 运行时契约应只维护命令和本地路径边界'),
];
