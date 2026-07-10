const mcpConfigContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpConfigContractTestMaintainabilityBudgets = [
  mcpConfigContractTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-config-contract-test-rules.mjs', 15, 'AI 治理 MCP 配置契约测试预算子表应只维护项目级 MCP 配置、server map 和敏感值测试预算'),
  mcpConfigContractTestBudget('scripts/ci/aiGovernanceMcpConfigContract.test.mjs', 75, 'AI 治理 MCP 配置契约测试应独立维护 JSON 结构和启动入口负例'),
  mcpConfigContractTestBudget('scripts/ci/aiGovernanceMcpServerMapContract.test.mjs', 25, 'AI 治理 MCP server map 测试应独立维护 mcpServers/servers 单源负例'),
  mcpConfigContractTestBudget('scripts/ci/aiGovernanceMcpSensitiveValues.test.mjs', 80, 'AI 治理 MCP 敏感值测试应独立维护 env、URL、args、header 和环境变量负例'),
];
