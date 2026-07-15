import { governanceAiRegistrationSnapshotTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-snapshot-test-rules.mjs';

const resultTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationResultTestMaintainabilityBudgets = [
  resultTestBudget('scripts/ci/maintainability-budget-governance-ai-registration-result-test-rules.mjs', 10, 'Registration result 测试预算子表只组合摄取、checkpoint 与 anchor/disclosure 子表'),
  resultTestBudget('scripts/ci/aiGovernanceRegistrationCanaryResult.test.mjs', 460, 'Registration result 测试应锁 caller grade、digest、trace、stale/retry/replay、host-only unblind、checkpoint 越权输入与 metrics unavailable'),
  resultTestBudget('scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpoint.test.mjs', 220, 'Registration checkpoint 测试应锁 reseal、混批、侧信道、过度声明、当前上下文绑定与零写入'),
  ...governanceAiRegistrationSnapshotTestMaintainabilityBudgets,
];
