const governanceAiRegistryCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiRegistryCoreMaintainabilityBudgets = [
  governanceAiRegistryCoreBudget('scripts/ci/maintainability-budget-governance-ai-registry-core-rules.mjs', 15, 'AI 治理资产注册表核心预算子表应独立维护注册表父表、子表和主流程预算'),
  governanceAiRegistryCoreBudget('scripts/ci/maintainability-budget-governance-ai-registry-evidence-rules.mjs', 15, 'AI 治理资产注册表证据预算子表应独立维护证据 descriptor、来源反查和语义证据 helper 预算'),
  governanceAiRegistryCoreBudget('scripts/ci/maintainability-budget-governance-ai-registry-failure-rules.mjs', 10, 'AI 治理资产注册表失败预算子表应独立维护失败 helper 预算'),
  governanceAiRegistryCoreBudget('scripts/ci/aiGovernanceAssetRegistryConstants.mjs', 10, 'AI 治理资产注册表常量应独立维护注册表路径并避免循环 import'),
  governanceAiRegistryCoreBudget('scripts/ci/aiGovernanceAssetRegistry.mjs', 55, 'AI 治理资产注册表检查应独立维护必需文件、发现资产和显式豁免集合'),
  governanceAiRegistryCoreBudget('scripts/ci/aiGovernanceAssetRegistryClassifications.mjs', 30, 'AI 治理资产注册表分类 helper 应独立维护状态、责任人、复核节奏和最近复核日期校验'),
  governanceAiRegistryCoreBudget('scripts/ci/aiGovernanceAssetRegistryClassificationCombinations.mjs', 25, 'AI 治理资产注册表分类组合 helper 应独立维护状态、责任人和复核节奏组合语义校验'),
  governanceAiRegistryCoreBudget('scripts/ci/aiGovernanceAssetRegistryRowFields.mjs', 25, 'AI 治理资产注册表行字段 helper 应独立维护目标表头、路径、状态、责任人、复核节奏、最近复核日期、类型、维护契约和治理证据映射'),
  governanceAiRegistryCoreBudget('scripts/ci/aiGovernanceAssetRegistryRows.mjs', 45, 'AI 治理资产注册表 Markdown 表格解析应只维护目标表格遍历、分隔行忽略和重复登记抽取'),
];
