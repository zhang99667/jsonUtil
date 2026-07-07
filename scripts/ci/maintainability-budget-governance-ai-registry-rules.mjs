const governanceAiRegistryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistryMaintainabilityBudgets = [
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryConstants.mjs', 10, 'AI 治理资产注册表常量应独立维护注册表路径并避免循环 import'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryEvidence.mjs', 65, 'AI 治理资产注册表证据标记应独立维护认可词表和实际来源匹配逻辑'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistry.mjs', 55, 'AI 治理资产注册表检查应独立维护必需文件、发现资产和显式豁免集合'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryFailures.mjs', 40, 'AI 治理资产注册表失败汇总应独立维护缺登记、重复登记和陈旧登记错误'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryRows.mjs', 60, 'AI 治理资产注册表 Markdown 表格解析应独立维护目标表头、路径、类型、维护契约、治理证据和重复登记抽取'),
];
