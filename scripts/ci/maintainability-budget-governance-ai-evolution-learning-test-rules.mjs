import { governanceAiRegistrationResultTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-result-test-rules.mjs';
const learningTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionLearningTestMaintainabilityBudgets = [
  learningTestBudget('scripts/ci/maintainability-budget-governance-ai-evolution-learning-test-rules.mjs', 25, 'AI evolution learning 测试预算子表应只维护 eval focus、feedback、experiment、suite 与 producer 测试'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionEvalFocus.test.mjs', 160, 'AI evolution focus 测试应直接锁定十一层全序、current-run 四类优先级、去重裁剪与 trace-policy 优先选择'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionFeedbackInbox.test.mjs', 110, 'Feedback inbox 核心测试应锁 reader、精确 JSON/event hash、隐私与过度声明的目标原因'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionFeedbackProfiles.test.mjs', 120, 'Feedback profile 测试应锁三个 candidate builder、重复 signal、跨事件 chain 与 v2/v3 profile 边界'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionFeedbackCompatibility.test.mjs', 105, 'Feedback compatibility 测试应锁 event id/hash 登记的历史 tuple 与跨 schema evidence profile 隔离'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionExperiments.test.mjs', 95, 'Experiment 测试应锁 v1/v2、fixture、paired repetitions、blinding、ingestion 与稳定失败原因'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionLearningFocus.test.mjs', 75, 'Learning focus 测试应锁 external blocker、prepared channel 与 policy/experiment/ingestion actionable 门槛'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionLearningReport.test.mjs', 45, 'Learning report 测试应锁无 experiment 的 maintainer correction 只进入 open signal 计数'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionSuiteFocus.test.mjs', 90, 'Evolution suite focus 测试应直接锁 learning、grader、base failure 与 coverage preparation 的完整优先级'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionSuiteReport.test.mjs', 80, 'Evolution suite 集成测试应锁 learning focus 引用、外部 blocker、stale replay 与缺资产 fail-closed'),
  learningTestBudget('scripts/ci/aiGovernanceRegistrationCanaryPacket.test.mjs', 150, 'Registration canary packet 测试应锁三视图泄漏、arm/lease、stale binding、隐私与零写入'),
  learningTestBudget('scripts/ci/prepare-ai-evolution-feedback.test.mjs', 70, 'Feedback producer 测试应锁固定 profile、无自动写入与不可评分声明'),
  ...governanceAiRegistrationResultTestMaintainabilityBudgets,
];
