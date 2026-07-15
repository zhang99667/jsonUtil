import { governanceAiMcpInfoHelperTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-info-helper-test-rules.mjs';
const mcpHelperTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpHelperTestMaintainabilityBudgets = [
  mcpHelperTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-helper-test-rules.mjs', 20, 'AI 治理 MCP helper 测试预算子表应独立维护固定 helper 测试预算'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-tool-definitions.test.mjs', 45, 'JSONUtils 治理 MCP tool definitions 测试应独立锁定固定工具顺序、描述和 input schema'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-tool-input.test.mjs', 45, 'JSONUtils 治理 MCP tool input 测试应锁定未知工具、额外字段和整数范围负例'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-handoff.test.mjs', 55, 'JSONUtils 治理 MCP handoff 测试应独立锁定治理焦点、worktree 风险和截断样本'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-validation-plan.test.mjs', 165, 'JSONUtils 治理 MCP validation plan 测试应锁定领域分类、权威 changed set、全量边界、人工复核与 hygiene 非分类语义'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-worktree.test.mjs', 100, 'JSONUtils 治理 MCP worktree 测试应锁定 NUL 分帧、Unicode/rename 路径、错误结构与真实 Git 展开'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-resources.test.mjs', 45, 'JSONUtils 治理 MCP resources 测试应独立锁定资源清单和只读文件读取边界'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-context.test.mjs', 70, 'JSONUtils 治理上下文测试应只锁定报告组合、版本和决策摘要'),
  ...governanceAiMcpInfoHelperTestMaintainabilityBudgets,
];
