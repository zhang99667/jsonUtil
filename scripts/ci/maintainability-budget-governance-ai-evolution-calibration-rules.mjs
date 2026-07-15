const calibrationBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionCalibrationMaintainabilityBudgets = [
  calibrationBudget('scripts/ci/maintainability-budget-governance-ai-evolution-calibration-rules.mjs', 20, 'Grader calibration 预算子表应只维护独立 contract、oracle、fixture、runner 与负例'),
  calibrationBudget('scripts/ci/aiGovernanceRequiredEvolutionCalibrationFiles.mjs', 15, 'Grader calibration 必需资产清单应保持独立且有界'),
  calibrationBudget('scripts/ci/aiGovernanceRegistrationCanaryCalibrationFixtures.mjs', 260, 'Registration calibration fixture 独立构造脱敏 packet/result 与完整 failure-taxonomy mutation，不包含 oracle'),
  calibrationBudget('scripts/ci/aiGovernanceRegistrationCanaryGraderCalibrationContract.mjs', 250, 'Registration grader calibration contract 应独立绑定实际 import、固定 ID、无 symlink 当前字节与完整独立 gold corpus'),
  calibrationBudget('scripts/ci/aiGovernanceRegistrationCanaryGraderCalibrationContract.test.mjs', 85, 'Registration grader calibration contract 测试应锁公开入口、非法 JSON、oracle 独立性与语义拒绝'),
  calibrationBudget('scripts/ci/aiGovernanceRegistrationCanaryGraderCalibration.mjs', 230, 'Registration grader calibration runner 应只维护真实 grader 执行、指标阈值、binding 接线与 component-only 报告'),
  calibrationBudget('scripts/ci/aiGovernanceRegistrationCanaryGraderCalibration.test.mjs', 180, 'Registration grader calibration runner 测试应锁分类、确定性、digest、suite 传播与零写账'),
  calibrationBudget('scripts/ci/aiGovernanceRegistrationCanaryGraderCalibrationRedteam.test.mjs', 140, 'Registration grader calibration 红队应锁路径替换、祖先 symlink、ID/taxonomy 缩减与 operation-ID 同源自证'),
];
