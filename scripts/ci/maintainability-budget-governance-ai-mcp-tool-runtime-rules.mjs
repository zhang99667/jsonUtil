import { governanceAiMcpInfoToolRuntimeMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-info-tool-runtime-rules.mjs';

const mcpToolRuntimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpToolRuntimeMaintainabilityBudgets = [
  mcpToolRuntimeBudget('scripts/ci/maintainability-budget-governance-ai-mcp-tool-runtime-rules.mjs', 20, 'AI 治理 MCP tool runtime 预算子表应组合固定工具定义、info tool 和状态工具 helper 预算'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-tool-definitions.mjs', 60, 'JSONUtils 治理 MCP tool definitions helper 应独立维护固定工具 schema、名称和顺序'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-tool-input.mjs', 45, 'JSONUtils 治理 MCP tool input helper 应拒绝未知工具、额外字段和越界参数'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-tools.mjs', 115, 'JSONUtils 治理 MCP tools helper 应独立维护固定命令、上下文调用和工具分发'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-handoff.mjs', 60, 'JSONUtils 治理 MCP handoff helper 应只组合治理焦点、worktree snapshot 和交接风险'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-validation-plan.mjs', 80, 'JSONUtils 治理 MCP validation plan helper 应只适配权威 changed set 并组装全量覆盖、命令、人工复核与未分类摘要'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-validation-rules.mjs', 85, 'JSONUtils 治理 MCP validation rules helper 应单源维护领域分类、固定命令与人工复核项'),
  mcpToolRuntimeBudget('scripts/mcp/jsonutils-governance-worktree.mjs', 120, 'JSONUtils 治理 MCP worktree helper 应只维护 hermetic NUL-framed git status snapshot、路径校验和结构化解析'),
  ...governanceAiMcpInfoToolRuntimeMaintainabilityBudgets,
];
