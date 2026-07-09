const mcpContractTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpContractTestMaintainabilityBudgets = [
  mcpContractTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-contract-test-rules.mjs', 10, 'AI 治理 MCP 契约测试预算子表应只维护 MCP 配置与运行时测试条目'),
  mcpContractTestBudget('scripts/ci/aiGovernanceMcpConfigContract.test.mjs', 70, 'AI 治理 MCP 配置契约测试应独立维护 JSON 结构和敏感字段负例'),
  mcpContractTestBudget('scripts/ci/aiGovernanceMcpSensitiveValues.test.mjs', 65, 'AI 治理 MCP 敏感值测试应独立维护 URL、args、header 和环境变量负例'),
  mcpContractTestBudget('scripts/ci/aiGovernanceMcpConfigRuntimeContract.test.mjs', 55, 'AI 治理 MCP 运行时契约测试应独立维护命令和路径负例'),
];
