import { governanceAiMcpHelperTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-helper-test-rules.mjs';
import { governanceAiMcpStdioTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-stdio-test-rules.mjs';

const mcpServerTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpServerTestMaintainabilityBudgets = [
  mcpServerTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-server-test-rules.mjs', 20, 'AI 治理 MCP server 测试预算子表应只组合 server、tools、helper 和 stdio 子表预算'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-server.test.mjs', 25, 'JSONUtils 治理 MCP server 测试应只锁定工具清单'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-frame-parser.test.mjs', 25, 'JSONUtils 治理 MCP frame parser 测试应独立锁定 Content-Length 分帧'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-tools.test.mjs', 75, 'JSONUtils 治理 MCP tools 测试应独立锁定固定命令、top 边界和 scorecard 输出'),
  ...governanceAiMcpHelperTestMaintainabilityBudgets,
  ...governanceAiMcpStdioTestMaintainabilityBudgets,
];
