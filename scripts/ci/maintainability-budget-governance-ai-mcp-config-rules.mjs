const mcpConfigBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiMcpConfigMaintainabilityBudgets = [
  mcpConfigBudget('scripts/ci/maintainability-budget-governance-ai-mcp-config-rules.mjs', 15, 'AI 治理 MCP config 预算子表应独立维护配置契约和 runtime helper 预算'),
  mcpConfigBudget('scripts/ci/maintainability-budget-governance-ai-mcp-contract-rules.mjs', 12, 'AI 治理 MCP 契约预算父表应只组合 MCP 配置和 runtime server 子表'),
  mcpConfigBudget('scripts/ci/aiGovernanceMcpConfigContract.mjs', 80, 'AI 治理 MCP 配置契约应只维护项目级 MCP JSON 结构和敏感字段边界'),
  mcpConfigBudget('scripts/ci/aiGovernanceCodexProjectMcpConfig.mjs', 55, 'Codex 项目 MCP 配置契约应只锁无 shell 项目根 bootstrap、固定工具 allowlist 与项目边界'),
  mcpConfigBudget('scripts/ci/aiGovernanceMcpSensitiveValues.mjs', 55, 'AI 治理 MCP 敏感值 helper 应独立维护 key、URL、args 和 header 明文检测'),
  mcpConfigBudget('scripts/ci/aiGovernanceMcpConfigRuntimeContract.mjs', 25, 'AI 治理 MCP 运行时契约入口应只遍历 server map 并转交 runtime helper'),
  mcpConfigBudget('scripts/ci/aiGovernanceMcpConfigRuntimeServerFailures.mjs', 30, 'AI 治理 MCP server 运行时 helper 应独立维护 command 和 cwd 边界'),
  mcpConfigBudget('scripts/ci/aiGovernanceMcpConfigRuntimeArgFailures.mjs', 35, 'AI 治理 MCP args 运行时 helper 应独立维护本地脚本和仓库内路径边界'),
];
