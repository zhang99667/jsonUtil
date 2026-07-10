import { governanceAiContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-contract-test-rules.mjs';
import { governanceAiCoreTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-core-test-rules.mjs';
import { governanceAiReferenceTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-test-rules.mjs';
import { governanceAiRegistryTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-test-rules.mjs';
const governanceAiTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiTestMaintainabilityBudgets = [
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-test-rules.mjs', 20, 'AI 治理测试预算聚合入口应只组合核心、注册表、引用和契约测试子表'),
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-registry-test-rules.mjs', 20, 'AI 治理注册表测试预算子表应独立维护注册表结构、证据、资产发现和语义测试预算'),
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-reference-test-rules.mjs', 20, 'AI 治理引用测试预算子表应独立维护测试入口、主题化负例数据和章节规则测试预算'),
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-contract-test-rules.mjs', 20, 'AI 治理契约测试预算子表应只组合根契约测试与入口、MCP、项目和 skill 测试子表'),
  ...governanceAiCoreTestMaintainabilityBudgets,
  ...governanceAiRegistryTestMaintainabilityBudgets,
  ...governanceAiReferenceTestMaintainabilityBudgets,
  ...governanceAiContractTestMaintainabilityBudgets,
];
