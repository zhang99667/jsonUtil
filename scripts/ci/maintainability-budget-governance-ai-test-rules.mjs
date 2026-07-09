import { governanceAiContractTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-contract-test-rules.mjs';
import { governanceAiReferenceTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-test-rules.mjs';
import { governanceAiRegistryTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-test-rules.mjs';
const governanceAiTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiTestMaintainabilityBudgets = [
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-test-rules.mjs', 25, 'AI 治理测试预算聚合入口应只组合核心、注册表、引用和契约测试子表'),
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-registry-test-rules.mjs', 20, 'AI 治理注册表测试预算子表应独立维护注册表结构、证据、资产发现和语义测试预算'),
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-reference-test-rules.mjs', 15, 'AI 治理引用测试预算子表应独立维护测试入口、主题化负例数据和章节规则测试预算'),
  governanceAiTestBudget('scripts/ci/maintainability-budget-governance-ai-contract-test-rules.mjs', 15, 'AI 治理契约测试预算子表应独立维护豁免、同源和 skill 契约测试预算'),
  governanceAiTestBudget('scripts/ci/aiGovernanceTestFixtures.mjs', 70, 'AI 治理测试 fixture 应独立维护临时目录、注册表表格构造和常用失败收集脚手架'),
  governanceAiTestBudget('scripts/ci/aiGovernanceCliOutput.test.mjs', 55, 'AI 治理 CLI 输出测试应独立维护 JSON 成功摘要和失败分组断言'),
  governanceAiTestBudget('scripts/ci/aiGovernanceAiSafetyEvidence.test.mjs', 90, 'AI 治理 AI 修复安全证据测试应独立维护关键测试证据清单、缺失和跳过负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceDecisionLedger.test.mjs', 170, 'AI 治理决策账本测试应独立维护结构、路径、CI 覆盖和日期顺序负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceDecisionLedgerTestEvidence.test.mjs', 50, 'AI 治理决策账本测试证据用例应独立维护空测试和活跃测试负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceDateBounds.test.mjs', 70, 'AI 治理日期边界测试应独立维护未来日期、资产注册表和决策账本负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceIsoDate.test.mjs', 25, 'AI 治理日期 helper 测试应独立维护闰年、月日边界和格式负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceScriptReachability.test.mjs', 45, 'AI 治理脚本可达性测试应独立维护孤儿 helper 与 import 图覆盖负例'),
  governanceAiTestBudget('scripts/ci/aiGovernanceChecks.test.mjs', 650, 'AI 治理主测试文件应显式纳入预算，新增场景优先评估按决策账本、CI 或引用规则契约拆分'),
  ...governanceAiRegistryTestMaintainabilityBudgets,
  ...governanceAiReferenceTestMaintainabilityBudgets,
  ...governanceAiContractTestMaintainabilityBudgets,
];
