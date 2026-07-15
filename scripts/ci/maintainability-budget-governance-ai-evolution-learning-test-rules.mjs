import { governanceAiRegistrationResultTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-result-test-rules.mjs';
const learningTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionLearningTestMaintainabilityBudgets = [
  learningTestBudget('scripts/ci/maintainability-budget-governance-ai-evolution-learning-test-rules.mjs', 12, 'AI evolution learning 测试预算子表应只维护 feedback、experiment、suite 与 producer 测试'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionFeedbackInbox.test.mjs', 100, 'Feedback inbox 测试应锁 hash、闭字段、隐私、过度声明与重复 signal'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionExperiments.test.mjs', 100, 'Experiment 测试应锁 split、paired repetitions、blinding 与 unavailable metrics'),
  learningTestBudget('scripts/ci/aiGovernanceEvolutionSuiteReport.test.mjs', 60, 'Evolution suite 测试应锁 learning focus 与缺资产 fail-closed'),
  learningTestBudget('scripts/ci/aiGovernanceRegistrationCanaryPacket.test.mjs', 150, 'Registration canary packet 测试应锁三视图泄漏、arm/lease、stale binding、隐私与零写入'),
  learningTestBudget('scripts/ci/prepare-ai-evolution-feedback.test.mjs', 70, 'Feedback producer 测试应锁固定 profile、无自动写入与不可评分声明'),
  ...governanceAiRegistrationResultTestMaintainabilityBudgets,
];
