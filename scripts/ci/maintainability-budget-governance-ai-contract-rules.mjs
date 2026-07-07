const governanceAiContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiContractMaintainabilityBudgets = [
  governanceAiContractBudget('scripts/ci/maintainability-budget-governance-ai-contract-rules.mjs', 20, 'AI 治理契约预算规则应独立维护 CI、同源入口、章节和 skill 契约子表'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiContract.mjs', 25, 'AI 治理 CI 契约检查应只维护必需治理命令和自动化入口比对'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCiCommandCollectors.mjs', 25, 'AI 治理 CI 命令收集器应独立维护 GitHub Actions run 块和本地 CI run_in_root 抽取'),
  governanceAiContractBudget('scripts/ci/aiGovernanceMirroredEntryContracts.mjs', 75, 'AI 治理同源入口契约应独立维护镜像章节和共享片段漂移检查'),
  governanceAiContractBudget('scripts/ci/aiGovernanceSharedEntrySnippets.mjs', 20, 'AI 治理工具入口共享片段应独立维护跨工具核心规则和覆盖文件清单'),
  governanceAiContractBudget('scripts/ci/aiGovernanceSectionReferences.mjs', 50, 'AI 治理章节引用检查应独立维护 Markdown 章节抽取和章节内关键词校验'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCodexSkillContract.mjs', 25, 'AI 治理 Codex skill 契约入口应只读取 skill 并组合结构、章节内容和引用契约'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCodexSkillStructureContract.mjs', 55, 'AI 治理 Codex skill 结构契约应独立维护 frontmatter 与核心章节存在性校验'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCodexSkillReferenceContract.mjs', 35, 'AI 治理 Codex skill 引用契约应独立维护项目路径和验证脚本存在性校验'),
  governanceAiContractBudget('scripts/ci/aiGovernanceCodexSkillSectionContract.mjs', 50, 'AI 治理 Codex skill 章节内容契约应独立维护每个核心章节的最小关键引用'),
];
