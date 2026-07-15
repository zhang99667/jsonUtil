import { governanceAiMcpToolRuntimeMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-tool-runtime-rules.mjs';

const mcpRuntimeBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpRuntimeMaintainabilityBudgets = [
  mcpRuntimeBudget('scripts/ci/maintainability-budget-governance-ai-mcp-runtime-rules.mjs', 28, 'AI 治理 MCP runtime 预算子表应只组合本地 server、framing、tools、resources 和 context helper 预算'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-server.mjs', 140, 'JSONUtils 治理 MCP server 应只维护 JSON-RPC 方法分发、runtime freshness 与 stdio session lifecycle'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-line-framing.mjs', 50, 'JSONUtils 治理 MCP line framing helper 应单源维护 newline 序列化、1 MiB 边界、fatal UTF-8、CRLF 与逐行恢复'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-jsonrpc.mjs', 70, 'JSONUtils 治理 MCP JSON-RPC helper 应单源维护请求/方法参数校验、notification 识别和标准错误载荷'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-cancellation.mjs', 75, 'JSONUtils 治理 MCP cancellation helper 应单源管理 in-flight ID、AbortController、取消竞态和连接关闭回收'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-session.mjs', 65, 'JSONUtils 治理 MCP session helper 应单源维护初始化状态、请求顺序和标准错误映射'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-runtime-freshness.mjs', 105, 'JSONUtils 治理 MCP runtime freshness helper 应只维护本地 import closure 指纹、漂移拒绝和固定 restart result'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-tool-worker-client.mjs', 100, 'JSONUtils 治理 MCP worker client 应只维护固定进程组、尺寸边界、超时和取消回收'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-tool-worker.mjs', 50, 'JSONUtils 治理 MCP worker 入口应只解析闭字段请求、前后复核实现指纹并执行一次工具'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-resources.mjs', 45, 'JSONUtils 治理 MCP resources helper 应只维护只读资源目录和文件读取边界'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-context.mjs', 55, 'JSONUtils 治理上下文 runner 应只执行固定治理命令并转交 context builder 组装'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-context-builder.mjs', 45, 'JSONUtils 治理上下文 builder 应只组合 context schema、项目摘要和报告摘要'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-project-summary.mjs', 30, 'JSONUtils 治理项目摘要 helper 应独立读取版本、CHANGELOG 顶部标题和最新决策'),
  mcpRuntimeBudget('scripts/mcp/jsonutils-governance-report-summary.mjs', 60, 'JSONUtils 治理报告摘要 helper 应独立维护失败计数、预算热点、成熟度 scorecard 和下一步命令'),
  ...governanceAiMcpToolRuntimeMaintainabilityBudgets,
];
