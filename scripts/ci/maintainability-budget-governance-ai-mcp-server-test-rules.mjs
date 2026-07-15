import { governanceAiMcpHelperTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-helper-test-rules.mjs';
import { governanceAiMcpStdioTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-stdio-test-rules.mjs';

const mcpServerTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpServerTestMaintainabilityBudgets = [
  mcpServerTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-server-test-rules.mjs', 20, 'AI 治理 MCP server 测试预算子表应只组合 server、tools、helper 和 stdio 子表预算'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-server.test.mjs', 55, 'JSONUtils 治理 MCP server 测试只锁工具清单与项目 plugin launcher stdio 启动'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-frame-parser.test.mjs', 65, 'JSONUtils 治理 MCP line parser 测试应锁定 UTF-8 分片、多消息、超长输入恢复和无 header 序列化'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-tools.test.mjs', 90, 'JSONUtils 治理 MCP tools 测试应独立锁定固定命令、bounded 边界、scorecard 和 evaluation 结构化输出'),
  ...governanceAiMcpHelperTestMaintainabilityBudgets,
  ...governanceAiMcpStdioTestMaintainabilityBudgets,
];
