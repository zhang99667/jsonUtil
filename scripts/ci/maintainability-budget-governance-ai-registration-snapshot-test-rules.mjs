import { governanceAiRegistrationAnchorTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-anchor-test-rules.mjs';

const snapshotTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationSnapshotTestMaintainabilityBudgets = [
  snapshotTestBudget('scripts/ci/maintainability-budget-governance-ai-registration-snapshot-test-rules.mjs', 18, 'Registration snapshot 测试预算子表只维护 producer、stdio、真实 preflight、直接 contract 与共享 fixture 测试'),
  snapshotTestBudget('scripts/ci/aiGovernanceEvolutionSealedWorktreeManifestContract.test.mjs', 100, 'Manifest contract 直接测试锁紧凑/闭字段/entry/bounds/payload 与旧 hash 导出同引用'),
  snapshotTestBudget('scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.test.mjs', 265, 'Snapshot 测试锁旧 hash、bounded descriptor、owner-only mode、篡改、敏感边界、ambient Git 和失败 retention'),
  snapshotTestBudget('scripts/ci/mcpLineDelimitedStdioClient.test.mjs', 85, 'MCP newline client 测试锁 buffer/queue 上限、固定脱敏错误、超时和 response id'),
  snapshotTestBudget('scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflight.test.mjs', 255, 'Snapshot preflight fixed 测试锁 packet 等价、盲态 digest、精确 MCP 配置、stderr 边界、真实 MCP 调用和零行为升级'),
  snapshotTestBudget('scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflightContract.test.mjs', 390, 'Snapshot preflight contract 直接矩阵锁配置闭字段、scorecard/RPC 投影、域分离 hash、隐私与 stderr limit/limit+1'),
  snapshotTestBudget('scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflightTestFixtures.mjs', 70, 'Snapshot preflight fixture 只共享三视图 packet、scorecard 调用、摘要和 owner-only 测试清理'),
  ...governanceAiRegistrationAnchorTestMaintainabilityBudgets,
];
