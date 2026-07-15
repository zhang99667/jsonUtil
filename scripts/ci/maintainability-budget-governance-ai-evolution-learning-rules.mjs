import { governanceAiRegistrationResultMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-result-rules.mjs';
import { governanceAiEvolutionCalibrationMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-calibration-rules.mjs';
const learningBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiEvolutionLearningMaintainabilityBudgets = [
  learningBudget('scripts/ci/maintainability-budget-governance-ai-evolution-learning-rules.mjs', 30, 'AI evolution learning 预算子表应只维护 eval suite、feedback 与 experiment 数据面'),
  learningBudget('scripts/ci/aiGovernanceEvolutionEvalContract.mjs', 250, 'AI evolution eval 契约应维护有界普通文件读取、六层闭字段 corpus schema、脱敏诊断与代表性覆盖检查'),
  learningBudget('scripts/ci/aiGovernanceEvolutionEvalFocus.mjs', 75, 'AI evolution focus helper 应整体维护 contract、current-run、freshness、outcome、ledger 与 coverage 的下一焦点全序'),
  learningBudget('scripts/ci/aiGovernanceEvolutionEvalReport.mjs', 150, 'AI evolution 基础报告入口应只编排 corpus、ledger、fixed replay、trace verification 与机器投影'),
  learningBudget('scripts/ci/aiGovernanceEvolutionEvalProjection.mjs', 165, 'AI evolution eval 投影应整体维护机器 schema、counts、coverage、失败分层、focus 与稳定 ID 顺序'),
  learningBudget('scripts/ci/aiGovernanceEvolutionFeedbackInbox.mjs', 190, 'Feedback inbox 应只维护闭字段脱敏事件、物理顺序/hash 和 event-hash 登记的历史 case 绑定'),
  learningBudget('scripts/ci/aiGovernanceEvolutionExperiments.mjs', 190, 'Experiment 契约应只维护 split、paired repetitions、blinding、trial plan 与 unavailable metrics'),
  learningBudget('scripts/ci/aiGovernanceEvolutionLearningFocus.mjs', 65, 'Learning focus helper 应整体维护外部 blocked focus 与仓内 actionable/preparation focus 的仲裁'),
  learningBudget('scripts/ci/aiGovernanceEvolutionLearningReport.mjs', 80, 'Learning report 应只组合 feedback、experiment、完整性、cross-link 与稳定机器投影'),
  learningBudget('scripts/ci/aiGovernanceEvolutionSuiteFocus.mjs', 25, 'Evolution suite focus helper 应整体维护 learning、grader、base failure 与 coverage preparation 的下一焦点全序'),
  learningBudget('scripts/ci/aiGovernanceEvolutionSuiteReport.mjs', 70, 'Evolution suite 应只合并基础 eval、learning、grader 与稳定机器投影'),
  learningBudget('scripts/ci/aiGovernanceRegistrationCanaryPacket.mjs', 240, 'Registration canary packet 应只维护三视图盲分、绑定摘要、arm/lease/preflight 与不可评分边界'),
  learningBudget('scripts/ci/aiGovernanceRequiredEvolutionLearningFiles.mjs', 30, 'Learning 必需资产清单应只登记 feedback、profiles、compatibility、experiment、learning report、producer 与对应测试'),
  learningBudget('scripts/ci/prepare-ai-evolution-feedback.mjs', 90, 'Feedback producer 应只输出固定脱敏 candidate，不写长期资产或 outcome ledger'),
  learningBudget('scripts/ci/prepare-ai-registration-canary.mjs', 150, 'Registration canary producer 应只稳定读取当前仓库并输出单一盲分投影'),
  ...governanceAiEvolutionCalibrationMaintainabilityBudgets, ...governanceAiRegistrationResultMaintainabilityBudgets,
];
