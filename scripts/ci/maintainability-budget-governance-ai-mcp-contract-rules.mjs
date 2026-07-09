const mcpContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiMcpContractMaintainabilityBudgets = [
  mcpContractBudget('scripts/ci/maintainability-budget-governance-ai-mcp-contract-rules.mjs', 10, 'AI 治理 MCP 契约预算子表应只维护 MCP 配置、运行时契约和本地 server/context 条目'),
  mcpContractBudget('scripts/ci/aiGovernanceMcpConfigContract.mjs', 80, 'AI 治理 MCP 配置契约应只维护项目级 MCP JSON 结构和敏感字段边界'),
  mcpContractBudget('scripts/ci/aiGovernanceMcpSensitiveValues.mjs', 55, 'AI 治理 MCP 敏感值 helper 应独立维护 key、URL、args 和 header 明文检测'),
  mcpContractBudget('scripts/ci/aiGovernanceMcpConfigRuntimeContract.mjs', 55, 'AI 治理 MCP 运行时契约应只维护命令和本地路径边界'),
  mcpContractBudget('scripts/mcp/jsonutils-governance-server.mjs', 190, 'JSONUtils 治理 MCP server 应只暴露只读资源、固定报告/上下文工具和 stdio framing'),
  mcpContractBudget('scripts/mcp/jsonutils-governance-context.mjs', 110, 'JSONUtils 治理上下文 helper 应只组合固定报告、版本、决策和下一步命令摘要'),
];
