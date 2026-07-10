import { governanceAiCoreSupportTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-core-support-test-rules.mjs';
import { governanceAiDecisionTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-decision-test-rules.mjs';
import { governanceAiSafetyTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-safety-test-rules.mjs';
import { governanceAiScorecardTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-scorecard-test-rules.mjs';

const governanceAiCoreTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCoreTestMaintainabilityBudgets = [
  governanceAiCoreTestBudget('scripts/ci/maintainability-budget-governance-ai-core-test-rules.mjs', 20, 'AI 治理核心测试预算父表应只组合核心支撑、安全、决策和 scorecard 测试预算子表'),
  ...governanceAiCoreSupportTestMaintainabilityBudgets,
  ...governanceAiSafetyTestMaintainabilityBudgets,
  ...governanceAiDecisionTestMaintainabilityBudgets,
  ...governanceAiScorecardTestMaintainabilityBudgets,
];
