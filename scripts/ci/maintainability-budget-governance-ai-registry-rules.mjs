import { governanceAiRegistryEvidenceMaintainabilityBudgets } from './maintainability-budget-governance-ai-registry-evidence-rules.mjs';
const governanceAiRegistryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiRegistryMaintainabilityBudgets = [
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryConstants.mjs', 10, 'AI 治理资产注册表常量应独立维护注册表路径并避免循环 import'),
  governanceAiRegistryBudget('scripts/ci/maintainability-budget-governance-ai-registry-evidence-rules.mjs', 15, 'AI 治理资产注册表证据预算子表应独立维护证据 descriptor、来源反查和语义证据 helper 预算'),
  ...governanceAiRegistryEvidenceMaintainabilityBudgets,
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistry.mjs', 55, 'AI 治理资产注册表检查应独立维护必需文件、发现资产和显式豁免集合'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryClassifications.mjs', 40, 'AI 治理资产注册表分类 helper 应独立维护状态、责任人、复核节奏、最近复核日期和组合语义校验'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryFailures.mjs', 40, 'AI 治理资产注册表失败汇总应独立维护缺登记、重复登记和陈旧登记错误'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryRows.mjs', 60, 'AI 治理资产注册表 Markdown 表格解析应独立维护目标表头、路径、状态、责任人、复核节奏、最近复核日期、类型、维护契约、治理证据和重复登记抽取'),
];
