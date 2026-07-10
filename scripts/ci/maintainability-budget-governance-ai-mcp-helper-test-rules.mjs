import { governanceAiMcpInfoHelperTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-info-helper-test-rules.mjs';
const mcpHelperTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpHelperTestMaintainabilityBudgets = [
  mcpHelperTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-helper-test-rules.mjs', 20, 'AI 治理 MCP helper 测试预算子表应独立维护固定 helper 测试预算'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-tool-definitions.test.mjs', 45, 'JSONUtils 治理 MCP tool definitions 测试应独立锁定固定工具顺序、描述和 input schema'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-handoff.test.mjs', 55, 'JSONUtils 治理 MCP handoff 测试应独立锁定治理焦点、worktree 风险和截断样本'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-validation-plan.test.mjs', 65, 'JSONUtils 治理 MCP validation plan 测试应独立锁定脏文件分类、命令去重和错误结构'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-worktree.test.mjs', 55, 'JSONUtils 治理 MCP worktree 测试应独立锁定 git status 解析、截断和错误结构'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-resources.test.mjs', 45, 'JSONUtils 治理 MCP resources 测试应独立锁定资源清单和只读文件读取边界'),
  mcpHelperTestBudget('scripts/mcp/jsonutils-governance-context.test.mjs', 70, 'JSONUtils 治理上下文测试应只锁定报告组合、版本和决策摘要'),
  ...governanceAiMcpInfoHelperTestMaintainabilityBudgets,
];
