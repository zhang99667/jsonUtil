const mcpInfoHelperTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpInfoHelperTestMaintainabilityBudgets = [
  mcpInfoHelperTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-info-helper-test-rules.mjs', 20, 'AI 治理 MCP info helper 测试预算子表应独立维护 report、asset、evaluation 和 decision helper 测试预算'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-report-tool.test.mjs', 60, 'JSONUtils 治理 MCP report tool 测试是单一集成契约，应共同锁定组合红态、底层状态与完整 scorecard 焦点一致性'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-assets.test.mjs', 45, 'JSONUtils 治理 MCP assets 测试应独立锁定资产注册表解析和 bounded 输出'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-evaluations.test.mjs', 135, 'JSONUtils 治理 MCP evaluations 集成测试应锁定 component 计数、空账本、非法 ledger 和脱敏输出'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-evaluation-projection.test.mjs', 85, 'JSONUtils 治理 MCP evaluation projection 测试应锁定 schema v3 键序、引用、limit 归一化和全局事实不裁剪'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-evaluation-outcomes.test.mjs', 35, 'JSONUtils 治理 MCP evaluation outcome 测试应锁定 verified v3 链字段、验证方法和 bounded 展示'),
  mcpInfoHelperTestBudget('scripts/mcp/jsonutils-governance-decisions.test.mjs', 60, 'JSONUtils 治理 MCP decisions 测试应独立锁定决策账本解析、limit 和命令提取'),
];
