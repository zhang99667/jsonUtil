const entryContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEntryContractMaintainabilityBudgets = [
  entryContractBudget('scripts/ci/maintainability-budget-governance-ai-entry-contract-rules.mjs', 15, 'AI 治理入口契约预算子表应只维护同源入口、工具薄入口、共享片段和章节引用契约条目'),
  entryContractBudget('scripts/ci/aiGovernanceMirroredEntryContracts.mjs', 55, 'AI 治理同源入口契约应独立维护镜像章节检查和入口聚合'),
  entryContractBudget('scripts/ci/aiGovernanceMirroredToolEntryContracts.mjs', 35, 'AI 治理工具薄入口契约应只维护工具入口契约编排'),
  entryContractBudget('scripts/ci/aiGovernanceMirroredToolEntryHistory.mjs', 15, 'AI 治理工具薄入口历史记录 helper 应独立维护独立更新记录标题检查'),
  entryContractBudget('scripts/ci/aiGovernanceMirroredToolEntrySnippetFailures.mjs', 15, 'AI 治理工具薄入口片段漂移 helper 应独立维护共享片段缺失检查'),
  entryContractBudget('scripts/ci/aiGovernanceSharedEntryAuthorityContract.mjs', 30, 'AI 治理共享薄入口片段权威来源契约应独立维护来源文件和锚点反查'),
  entryContractBudget('scripts/ci/aiGovernanceSharedEntrySnippets.mjs', 45, 'AI 治理工具入口共享片段应独立维护跨工具核心规则、权威来源和覆盖文件清单'),
  entryContractBudget('scripts/ci/aiGovernanceSectionReferences.mjs', 50, 'AI 治理章节引用检查应独立维护 Markdown 章节抽取和章节内关键词校验'),
];
