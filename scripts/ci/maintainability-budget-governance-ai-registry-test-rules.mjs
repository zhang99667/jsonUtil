import { governanceAiRegistryEvidenceTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-evidence-test-rules.mjs';

const governanceAiRegistryTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistryTestMaintainabilityBudgets = [
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistry.test.mjs', 55, 'AI 治理资产注册表测试应独立维护登记结构必填和重复登记负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryCoverage.test.mjs', 80, 'AI 治理资产注册表覆盖率测试应独立维护缺登记和证据来源上下文负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryClassificationCombinations.test.mjs', 55, 'AI 治理资产注册表分类组合测试应独立维护状态、责任人和复核节奏错配负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryOwner.test.mjs', 45, 'AI 治理资产注册表责任人测试应独立维护缺责任人和未知责任人负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryReviewCadence.test.mjs', 30, 'AI 治理资产注册表复核节奏测试应独立维护缺复核节奏和未知复核节奏负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryReviewDate.test.mjs', 40, 'AI 治理资产注册表最近复核日期测试应独立维护缺日期、格式错误和伪日期负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryStatus.test.mjs', 45, 'AI 治理资产注册表状态测试应独立维护缺状态和未知状态负例'),
  governanceAiRegistryTestBudget('scripts/ci/aiGovernanceAssetRegistryStaleEntries.test.mjs', 50, 'AI 治理资产注册表陈旧登记测试应独立维护已移除资产负例'),
  ...governanceAiRegistryEvidenceTestMaintainabilityBudgets,
];
