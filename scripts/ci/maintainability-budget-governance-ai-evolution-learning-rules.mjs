import { governanceAiRegistrationResultMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-result-rules.mjs';
const learningBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionLearningMaintainabilityBudgets = [
  learningBudget('scripts/ci/maintainability-budget-governance-ai-evolution-learning-rules.mjs', 18, 'AI evolution learning 预算子表应只维护 eval suite、feedback 与 experiment 数据面'),
  learningBudget('scripts/ci/aiGovernanceEvolutionEvalContract.mjs', 190, 'AI evolution eval 契约应维护 corpus schema、敏感字段和代表性覆盖检查'),
  learningBudget('scripts/ci/aiGovernanceEvolutionEvalFocus.mjs', 60, 'AI evolution focus helper 应只维护 verdict、未验证 trace 与 coverage 下一焦点'),
  learningBudget('scripts/ci/aiGovernanceEvolutionEvalReport.mjs', 190, 'AI evolution 基础报告应组合 corpus、receipt、fixed replay、trace verification、lineage 与 coverage'),
  learningBudget('scripts/ci/aiGovernanceEvolutionFeedbackInbox.mjs', 190, 'Feedback inbox 应只维护闭字段脱敏事件、物理顺序/hash 和 case 绑定'),
  learningBudget('scripts/ci/aiGovernanceEvolutionExperiments.mjs', 190, 'Experiment 契约应只维护 split、paired repetitions、blinding、trial plan 与 unavailable metrics'),
  learningBudget('scripts/ci/aiGovernanceEvolutionLearningReport.mjs', 110, 'Learning report 应只组合 feedback、experiment、外部 blocked focus 与不依赖该前置的 actionable focus'),
  learningBudget('scripts/ci/aiGovernanceEvolutionSuiteReport.mjs', 60, 'Evolution suite 应只合并基础 eval 与 learning report 并选择下一焦点'),
  learningBudget('scripts/ci/aiGovernanceRegistrationCanaryPacket.mjs', 240, 'Registration canary packet 应只维护三视图盲分、绑定摘要、arm/lease/preflight 与不可评分边界'),
  learningBudget('scripts/ci/aiGovernanceRequiredEvolutionLearningFiles.mjs', 20, 'Learning 必需资产清单应只登记 feedback、experiment、producer 与对应测试'),
  learningBudget('scripts/ci/prepare-ai-evolution-feedback.mjs', 90, 'Feedback producer 应只输出固定脱敏 candidate，不写长期资产或 outcome ledger'),
  learningBudget('scripts/ci/prepare-ai-registration-canary.mjs', 150, 'Registration canary producer 应只稳定读取当前仓库并输出单一盲分投影'),
  ...governanceAiRegistrationResultMaintainabilityBudgets,
];
