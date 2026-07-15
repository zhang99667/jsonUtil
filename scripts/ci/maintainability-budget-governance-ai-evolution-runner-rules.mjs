const runnerBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionRunnerMaintainabilityBudgets = [
  runnerBudget('scripts/ci/maintainability-budget-governance-ai-evolution-runner-rules.mjs', 20, 'AI evolution runner 预算子表应只维护 registry、执行、失败分类与投影负例'),
  runnerBudget('scripts/ci/aiGovernanceRequiredEvolutionRunnerFiles.mjs', 18, 'AI evolution runner 必需清单应登记 registry、执行、分类、CLI 与投影测试'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionCaseRunner.mjs', 125, 'AI evolution case runner 应只维护公开兼容导出、版本绑定、Hermetic 环境与有界执行报告'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionExecutableCases.mjs', 180, 'AI evolution executable registry 应只维护固定 case 顺序、证据范围与命令 descriptor'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionCaseDescriptorRegistry.mjs', 15, 'AI evolution descriptor registry 应只保持跨组插入顺序、冻结结果并拒绝重复 case id'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionCodexBoundaryCaseDescriptors.mjs', 85, 'Codex boundary descriptors 应只维护 trace、fixed trial、controller 与项目 plugin Skill 的 component case 定义'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionCaseFailure.mjs', 140, 'AI evolution failure helper 应只维护闭字段分类、脱敏诊断、计数与焦点投影'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionCaseRunner.test.mjs', 225, 'AI evolution case runner 测试应锁定公开执行、版本绑定、证据范围和变更矩阵边界'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionExecutableCases.test.mjs', 75, 'AI evolution executable registry 测试应只锁定唯一合并、公开重导出、冻结与 ID 顺序'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionExecutableCaseDescriptors.test.mjs', 135, 'AI evolution executable descriptor 测试应锁定 ownership、outcome、observable、project plugin、registration grader 与 rule evolution 的关键固定命令'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionCaseFailure.test.mjs', 100, 'AI evolution failure 测试应锁四类失败、固定 reason 与零自由输出泄漏'),
  runnerBudget('scripts/ci/aiGovernanceEvolutionFailureProjection.test.mjs', 80, 'AI evolution failure 投影测试应锁 behavior、component、delivery 与 infrastructure 的 scorecard/focus 分层'),
];
