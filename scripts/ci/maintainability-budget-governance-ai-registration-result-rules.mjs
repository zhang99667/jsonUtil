import { governanceAiRegistrationSnapshotMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-snapshot-rules.mjs';

const resultBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationResultMaintainabilityBudgets = [
  resultBudget('scripts/ci/maintainability-budget-governance-ai-registration-result-rules.mjs', 22, 'Registration result 预算子表只维护 blind result、review、checkpoint 与 stdin-only CLI'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryBlindResult.mjs', 340, 'Registration blind result 契约应只维护闭字段摄取、trace 绑定、隐私与侧信道拒绝'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryResult.mjs', 320, 'Registration result façade 应保持摄取兼容导出，并只维护 Agent/grader projection 与无 arm 确定性评分'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryReview.mjs', 390, 'Registration review 应只维护 blind grade set、host-only run record、独立揭盲和未验信指标预览'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpoint.mjs', 20, 'Registration checkpoint façade 只保持 request 与 binding 公开 API 的同引用兼容导出'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpointRequest.mjs', 330, 'Registration checkpoint request 只维护 detached grade-set subject、当前上下文校验与 external-anchor-required 边界'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpointBinding.mjs', 110, 'Registration checkpoint binding 只从闭字段原始输入重建 review 并保持 writeback blocked'),
  resultBudget('scripts/ci/aiGovernanceRegistrationCanaryCaseDescriptors.mjs', 60, 'Registration case descriptor 是单一声明表，应只映射 snapshot、packet、result、checkpoint 并组合 anchor/disclosure component case'),
  resultBudget('scripts/ci/review-ai-registration-canary-results.mjs', 145, 'Registration review CLI 应只从 bounded stdin 执行 blind、seal、checkpoint、unblind 四阶段且零写入'),
  ...governanceAiRegistrationSnapshotMaintainabilityBudgets,
];
