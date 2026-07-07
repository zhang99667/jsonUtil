const governanceAiRegistryEvidenceBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistryEvidenceMaintainabilityBudgets = [
  governanceAiRegistryEvidenceBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSourceDescriptors.mjs', 35, 'AI 治理资产注册表证据来源描述符应独立维护 marker 到来源集合的单源映射'),
  governanceAiRegistryEvidenceBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceMarkers.mjs', 30, 'AI 治理资产注册表证据标记词表应独立维护认可标记、分隔解析和未知标记识别'),
  governanceAiRegistryEvidenceBudget('scripts/ci/aiGovernanceAssetRegistryEvidence.mjs', 40, 'AI 治理资产注册表证据来源反查应独立维护描述符到实际治理集合的匹配逻辑'),
  governanceAiRegistryEvidenceBudget('scripts/ci/aiGovernanceAssetRegistrySemanticEvidence.mjs', 30, 'AI 治理资产注册表语义证据规则应独立维护自动发现资产的非发现证据要求'),
  governanceAiRegistryEvidenceBudget('scripts/ci/aiGovernanceAssetRegistryRowEvidenceFailures.mjs', 35, 'AI 治理资产注册表行证据失败规则应独立维护单行必填、证据来源和语义证据失败'),
  governanceAiRegistryEvidenceBudget('scripts/ci/aiGovernanceAssetRegistryEvidenceSources.mjs', 80, 'AI 治理资产注册表证据来源集合应独立维护预算、引用、章节、skill 和同源漂移来源映射'),
];
