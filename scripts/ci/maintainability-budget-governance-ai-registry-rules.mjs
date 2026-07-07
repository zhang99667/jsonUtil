import { governanceAiDecisionMaintainabilityBudgets } from './maintainability-budget-governance-ai-decision-rules.mjs';
const governanceAiRegistryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiRegistryMaintainabilityBudgets = [
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryConstants.mjs', 10, 'AI 治理资产注册表常量应独立维护注册表路径并避免循环 import'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSourceDescriptors.mjs', 35, 'AI 治理资产注册表证据来源描述符应独立维护 marker 到来源集合的单源映射'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceMarkers.mjs', 30, 'AI 治理资产注册表证据标记词表应独立维护认可标记、分隔解析和未知标记识别'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryEvidence.mjs', 40, 'AI 治理资产注册表证据来源反查应独立维护描述符到实际治理集合的匹配逻辑'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistrySemanticEvidence.mjs', 30, 'AI 治理资产注册表语义证据规则应独立维护自动发现资产的非发现证据要求'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryRowEvidenceFailures.mjs', 35, 'AI 治理资产注册表行证据失败规则应独立维护单行必填、证据来源和语义证据失败'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSources.mjs', 80, 'AI 治理资产注册表证据来源集合应独立维护预算、引用、章节、skill 和同源漂移来源映射'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistry.mjs', 55, 'AI 治理资产注册表检查应独立维护必需文件、发现资产和显式豁免集合'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryFailures.mjs', 40, 'AI 治理资产注册表失败汇总应独立维护缺登记、重复登记和陈旧登记错误'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryRows.mjs', 60, 'AI 治理资产注册表 Markdown 表格解析应独立维护目标表头、路径、类型、维护契约、治理证据和重复登记抽取'),
  ...governanceAiDecisionMaintainabilityBudgets,
];
