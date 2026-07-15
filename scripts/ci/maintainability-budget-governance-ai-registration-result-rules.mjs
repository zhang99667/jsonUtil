import { governanceAiRegistrationSnapshotMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-snapshot-rules.mjs';

const resultBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationResultMaintainabilityBudgets = [
  resultBudget('scripts/ci/maintainability-budget-governance-ai-registration-result-rules.mjs', 15, 'Registration result 预算子表只维护 blind result、review、checkpoint 与 stdin-only CLI'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryResult.mjs', 390, 'Registration blind result 应只维护闭字段摄取、trace 绑定与无 arm 确定性评分'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryReview.mjs', 390, 'Registration review 应只维护 blind grade set、host-only run record、独立揭盲和未验信指标预览'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpoint.mjs', 320, 'Registration checkpoint 应只维护 detached grade-set subject、当前上下文绑定、review 重建与 external-anchor-required 边界'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryCaseDescriptors.mjs', 45, 'Registration case descriptor 应只映射 snapshot、packet、result 与 checkpoint component case'),
  resultBudget('scripts/ci/review-ai-registration-canary-results.mjs', 145, 'Registration review CLI 应只从 bounded stdin 执行 blind、seal、checkpoint、unblind 四阶段且零写入'),
  ...governanceAiRegistrationSnapshotMaintainabilityBudgets,
];
