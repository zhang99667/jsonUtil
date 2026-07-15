import { governanceAiRegistrationAnchorTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-anchor-test-rules.mjs';

const snapshotTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationSnapshotTestMaintainabilityBudgets = [
  snapshotTestBudget('scripts/ci/maintainability-budget-governance-ai-registration-snapshot-test-rules.mjs', 14, 'Registration snapshot 测试预算子表只维护 producer、stdio 与真实 preflight 测试'),
  snapshotTestBudget('scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.test.mjs', 265, 'Snapshot 测试锁旧 hash、bounded descriptor、owner-only mode、篡改、敏感边界、ambient Git 和失败 retention'),
  snapshotTestBudget('scripts/ci/mcpLineDelimitedStdioClient.test.mjs', 85, 'MCP newline client 测试锁 buffer/queue 上限、固定脱敏错误、超时和 response id'),
  snapshotTestBudget('scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflight.test.mjs', 170, 'Snapshot preflight 测试锁 packet 等价、盲态 digest、retention、真实 MCP 调用和零行为升级'),
  ...governanceAiRegistrationAnchorTestMaintainabilityBudgets,
];
