const mcpStdioTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpStdioTestMaintainabilityBudgets = [
  mcpStdioTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-stdio-test-rules.mjs', 20, 'AI 治理 MCP stdio 测试预算子表应独立维护真实链路和测试客户端预算'),
  mcpStdioTestBudget('scripts/ci/jsonutilsGovernanceMcpTestFixtures.mjs', 30, 'JSONUtils 治理 MCP 测试 fixture 应单源维护临时 root 和文件写入脚手架'),
  mcpStdioTestBudget('scripts/ci/mcpContentLengthStdioClient.mjs', 5, '旧 MCP stdio client 路径只保留历史决策兼容并重导出 newline 实现'),
  mcpStdioTestBudget('scripts/ci/jsonutilsGovernanceMcpStdioTestClient.mjs', 45, 'JSONUtils 治理 MCP stdio 测试客户端应独立维护项目配置读取、真实 server 启动和原始 stdout 观测'),
  mcpStdioTestBudget('scripts/ci/jsonutilsGovernanceMcpToolCallClient.mjs', 15, 'JSONUtils 治理 MCP tool 调用测试客户端应只维护 tools/call JSON 解析'),
  mcpStdioTestBudget('scripts/mcp/jsonutils-governance-stdio.test.mjs', 55, 'JSONUtils 治理 MCP stdio 测试应只锁定工具清单、资源读取和上下文工具端到端断言'),
  mcpStdioTestBudget('scripts/mcp/jsonutils-governance-stdio-tools.test.mjs', 45, 'JSONUtils 治理 MCP stdio tools 测试应独立锁定 scorecard、freshness、evaluation 和 worktree 端到端断言'),
  mcpStdioTestBudget('scripts/mcp/jsonutils-governance-stdio-handoff-tools.test.mjs', 35, 'JSONUtils 治理 MCP stdio handoff tools 测试应独立锁定 handoff、decision 和 validation 端到端断言'),
  mcpStdioTestBudget('scripts/mcp/jsonutils-governance-protocol-stdio.test.mjs', 55, 'JSONUtils 治理 MCP stdio 协议测试应独立锁定版本协商和逐行多消息 framing'),
  mcpStdioTestBudget('scripts/mcp/jsonutils-governance-invalid-request-stdio.test.mjs', 90, 'JSONUtils 治理 MCP Invalid Request 测试应独立锁定请求/工具参数校验、notification 隔离、恢复与脱敏错误'),
];
