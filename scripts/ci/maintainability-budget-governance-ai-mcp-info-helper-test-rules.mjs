const mcpInfoHelperTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpInfoHelperTestMaintainabilityBudgets = [
  mcpInfoHelperTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-info-helper-test-rules.mjs', 15, 'AI 治理 MCP info helper 测试预算子表应独立维护 report、asset 和 decision helper 测试预算'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-report-tool.test.mjs', 45, 'JSONUtils 治理 MCP report tool 测试应独立锁定 report 与完整 scorecard 焦点一致性'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-assets.test.mjs', 45, 'JSONUtils 治理 MCP assets 测试应独立锁定资产注册表解析和 bounded 输出'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-decisions.test.mjs', 60, 'JSONUtils 治理 MCP decisions 测试应独立锁定决策账本解析、limit 和命令提取'),
];
