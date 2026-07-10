import { governanceAiMcpInfoToolRuntimeMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-info-tool-runtime-rules.mjs';

const mcpToolRuntimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpToolRuntimeMaintainabilityBudgets = [
  mcpToolRuntimeBudget('scripts/ci/maintainability-budget-governance-ai-mcp-tool-runtime-rules.mjs', 20, 'AI 治理 MCP tool runtime 预算子表应组合固定工具定义、info tool 和状态工具 helper 预算'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-tool-definitions.mjs', 60, 'JSONUtils 治理 MCP tool definitions helper 应独立维护固定工具 schema、名称和顺序'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-tools.mjs', 115, 'JSONUtils 治理 MCP tools helper 应独立维护固定命令、上下文调用和工具分发'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-handoff.mjs', 60, 'JSONUtils 治理 MCP handoff helper 应只组合治理焦点、worktree snapshot 和交接风险'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-validation-plan.mjs', 75, 'JSONUtils 治理 MCP validation plan helper 应只维护脏文件到验证命令的固定映射'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-worktree.mjs', 85, 'JSONUtils 治理 MCP worktree helper 应只维护固定 git status snapshot 和结构化解析'),
  ...governanceAiMcpInfoToolRuntimeMaintainabilityBudgets,
];
