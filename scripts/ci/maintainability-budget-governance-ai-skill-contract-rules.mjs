const governanceAiSkillContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiSkillContractMaintainabilityBudgets = [
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillContract.mjs', 25, 'AI 治理 Codex skill 契约入口应只读取 skill 并组合结构、章节内容和引用契约'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillCommandBlocks.mjs', 10, 'AI 治理 Codex skill 命令块抽取应独立复用 fenced code block 解析'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillDirectoryContract.mjs', 35, 'AI 治理 Codex skill 目录契约应独立维护 fenced cd 工作目录可达性校验'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillStructureContract.mjs', 55, 'AI 治理 Codex skill 结构契约应独立维护 frontmatter 与核心章节存在性校验'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillReferenceContract.mjs', 35, 'AI 治理 Codex skill 引用契约应独立维护项目路径和验证脚本存在性校验'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillNpmScriptContract.mjs', 35, 'AI 治理 Codex skill npm 脚本契约应独立维护 fenced npm run 可达性校验'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillSectionContract.mjs', 50, 'AI 治理 Codex skill 章节内容契约应独立维护每个核心章节的最小关键引用'),
];
