const governanceAiContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiContractMaintainabilityBudgets = [
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-contract-rules.mjs', 20, 'AI 治理契约预算规则应独立维护 CI、同源入口、章节和 skill 契约子表'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiContract.mjs', 35, 'AI 治理 CI 契约检查应独立维护 GitHub Actions 和本地 CI 的治理门禁命令'),
  governanceAiContractBudget('scripts/ci/aiGovernanceMirroredEntryContracts.mjs', 75, 'AI 治理同源入口契约应独立维护镜像章节和共享片段漂移检查'),
  governanceAiContractBudget('scripts/ci/aiGovernanceSectionReferences.mjs', 50, 'AI 治理章节引用检查应独立维护 Markdown 章节抽取和章节内关键词校验'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCodexSkillContract.mjs', 55, 'AI 治理 Codex skill 契约检查应独立维护 frontmatter 与核心章节校验'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCodexSkillSectionContract.mjs', 50, 'AI 治理 Codex skill 章节内容契约应独立维护每个核心章节的最小关键引用'),
];
