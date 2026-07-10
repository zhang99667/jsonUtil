const mcpInfoToolRuntimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpInfoToolRuntimeMaintainabilityBudgets = [
  mcpInfoToolRuntimeBudget('scripts/ci/maintainability-budget-governance-ai-mcp-info-tool-runtime-rules.mjs', 15, 'AI 治理 MCP info tool runtime 预算子表应独立维护 report、scorecard、asset 和 decision helper 预算'),
  mcpInfoToolRuntimeBudget('scripts/mcp/jsonutils-governance-report-tool.mjs', 45, 'JSONUtils 治理 MCP report tool helper 应只维护治理报告与完整 scorecard 焦点组装'),
  mcpInfoToolRuntimeBudget('scripts/mcp/jsonutils-governance-scorecard-tool.mjs', 35, 'JSONUtils 治理 MCP scorecard tool helper 应只维护完整 scorecard 载荷组装'),
  mcpInfoToolRuntimeBudget('scripts/mcp/jsonutils-governance-assets.mjs', 45, 'JSONUtils 治理 MCP assets helper 应只维护固定资产注册表读取和 bounded 结构化清单'),
  mcpInfoToolRuntimeBudget('scripts/mcp/jsonutils-governance-decisions.mjs', 45, 'JSONUtils 治理 MCP decisions helper 应只维护固定决策账本读取和 bounded 结构化摘要'),
];
