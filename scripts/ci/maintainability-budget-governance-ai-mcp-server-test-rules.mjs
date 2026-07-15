import { governanceAiMcpHelperTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-helper-test-rules.mjs';
import { governanceAiMcpStdioTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-mcp-stdio-test-rules.mjs';

const mcpServerTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiMcpServerTestMaintainabilityBudgets = [
  mcpServerTestBudget('scripts/ci/maintainability-budget-governance-ai-mcp-server-test-rules.mjs', 25, 'AI 治理 MCP server 测试预算子表应只组合 server、tools、controller/worker freshness、helper 和 stdio 子表预算'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-server.test.mjs', 55, 'JSONUtils 治理 MCP server 测试只锁工具清单与项目 plugin launcher stdio 启动'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-frame-parser.test.mjs', 80, 'JSONUtils 治理 MCP line parser 直接测试应锁定旧路径同引用、UTF-8 分片、多消息、超长输入恢复和无 header 序列化'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-tools.test.mjs', 115, 'JSONUtils 治理 MCP tools 测试应独立锁定 fixed worker 调度、最大报告 envelope、固定命令、bounded 边界、scorecard 和 evaluation 结构化输出'),
  mcpServerTestBudget('scripts/mcp/jsonutils-governance-runtime-freshness.test.mjs', 120, 'JSONUtils 治理 MCP runtime freshness 入口测试应锁定 controller/source fingerprint、data-plane 分层、root 逃逸和固定 restart-required，并注册 worker 测试组'),
  mcpServerTestBudget('scripts/mcp/jsonutilsGovernanceToolWorkerFreshnessTestCases.mjs', 145, 'JSONUtils 治理 MCP worker freshness 测试组应独立锁定 transitive ESM 重载、闭字段输出与 POSIX 取消/超时/输出超限进程组回收'),
  ...governanceAiMcpHelperTestMaintainabilityBudgets,
  ...governanceAiMcpStdioTestMaintainabilityBudgets,
];
