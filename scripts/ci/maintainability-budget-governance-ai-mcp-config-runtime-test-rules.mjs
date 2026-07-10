const mcpConfigRuntimeTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpConfigRuntimeTestMaintainabilityBudgets = [
  mcpConfigRuntimeTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-config-runtime-test-rules.mjs', 10, 'AI 治理 MCP 配置运行时测试预算子表应只维护命令、路径和 runtime fixture 预算'),
  mcpConfigRuntimeTestBudget('scripts/ci/aiGovernanceMcpConfigRuntimeContract.test.mjs', 55, 'AI 治理 MCP 运行时契约测试应独立维护命令和路径负例'),
  mcpConfigRuntimeTestBudget('scripts/ci/aiGovernanceMcpConfigRuntimeFileTestFixtures.mjs', 15, 'AI 治理 MCP 运行时文件 fixture 应独立维护配置 JSON 和本地脚本写入'),
  mcpConfigRuntimeTestBudget('scripts/ci/aiGovernanceMcpConfigRuntimeTestFixtures.mjs', 15, 'AI 治理 MCP 运行时测试 fixture 应只维护失败断言脚手架'),
];
