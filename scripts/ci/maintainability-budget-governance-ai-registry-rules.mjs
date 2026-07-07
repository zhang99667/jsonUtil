const governanceAiRegistryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistryMaintainabilityBudgets = [
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryConstants.mjs', 10, 'AI 治理资产注册表常量应独立维护注册表路径并避免循环 import'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryEvidence.mjs', 65, 'AI 治理资产注册表证据标记应独立维护认可词表和实际来源匹配逻辑'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSources.mjs', 80, 'AI 治理资产注册表证据来源集合应独立维护预算、引用、章节、skill 和同源漂移来源映射'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistry.mjs', 55, 'AI 治理资产注册表检查应独立维护必需文件、发现资产和显式豁免集合'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryFailures.mjs', 40, 'AI 治理资产注册表失败汇总应独立维护缺登记、重复登记和陈旧登记错误'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceAssetRegistryRows.mjs', 60, 'AI 治理资产注册表 Markdown 表格解析应独立维护目标表头、路径、类型、维护契约、治理证据和重复登记抽取'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceDecisionLedger.mjs', 60, 'AI 治理决策账本检查应只组合文件读取、日期顺序、回写路径和锁定测试校验'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceDecisionLedgerTable.mjs', 35, 'AI 治理决策账本表格解析应独立维护目标表头、分隔行和决策记录抽取'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceDecisionLedgerReferences.mjs', 20, 'AI 治理决策账本引用 helper 应独立维护反引号路径和命令解析'),
  governanceAiRegistryBudget('scripts/ci/aiGovernanceDecisionReferenceRule.mjs', 15, 'AI 治理决策账本引用规则应独立维护账本自身的关键引用'),
];
