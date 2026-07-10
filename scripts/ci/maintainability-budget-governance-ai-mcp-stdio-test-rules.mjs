const mcpStdioTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpStdioTestMaintainabilityBudgets = [
  mcpStdioTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-stdio-test-rules.mjs', 15, 'AI 治理 MCP stdio 测试预算子表应独立维护真实链路和测试客户端预算'),
  mcpStdioTestBudget('scripts/ci/jsonutilsGovernanceMcpTestFixtures.mjs', 30, 'JSONUtils 治理 MCP 测试 fixture 应单源维护临时 root 和文件写入脚手架'),
  mcpStdioTestBudget('scripts/ci/mcpContentLengthStdioClient.mjs', 70, 'MCP Content-Length stdio client 应独立维护 framing、响应读取和请求发送'),
  mcpStdioTestBudget('scripts/ci/jsonutilsGovernanceMcpStdioTestClient.mjs', 40, 'JSONUtils 治理 MCP stdio 测试客户端应独立维护项目配置读取和真实 server 启动'),
  mcpStdioTestBudget('scripts/ci/jsonutilsGovernanceMcpToolCallClient.mjs', 15, 'JSONUtils 治理 MCP tool 调用测试客户端应只维护 tools/call JSON 解析'),
  mcpStdioTestBudget('scripts/mcp/jsonutils-governance-stdio.test.mjs', 55, 'JSONUtils 治理 MCP stdio 测试应只锁定工具清单、资源读取和上下文工具端到端断言'),
  mcpStdioTestBudget('scripts/mcp/jsonutils-governance-stdio-tools.test.mjs', 35, 'JSONUtils 治理 MCP stdio tools 测试应独立锁定 scorecard、freshness 和 worktree 工具端到端断言'),
  mcpStdioTestBudget('scripts/mcp/jsonutils-governance-stdio-handoff-tools.test.mjs', 35, 'JSONUtils 治理 MCP stdio handoff tools 测试应独立锁定 handoff、decision 和 validation 端到端断言'),
];
