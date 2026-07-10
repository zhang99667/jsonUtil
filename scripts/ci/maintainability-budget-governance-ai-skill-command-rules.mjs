const governanceAiSkillCommandBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiSkillCommandMaintainabilityBudgets = [
  governanceAiSkillCommandBudget('scripts/ci/maintainability-budget-governance-ai-skill-command-rules.mjs', 15, 'AI 治理 skill 命令预算子表应独立维护 command block、cd 和 npm 契约预算'),
  governanceAiSkillCommandBudget('scripts/ci/aiGovernanceCodexSkillCommandBlocks.mjs', 10, 'AI 治理 Codex skill 命令块抽取应独立复用 fenced code block 解析'),
  governanceAiSkillCommandBudget('scripts/ci/aiGovernanceCodexSkillDirectoryContract.mjs', 35, 'AI 治理 Codex skill 目录契约应独立维护 fenced cd 工作目录可达性校验'),
  governanceAiSkillCommandBudget('scripts/ci/aiGovernanceCodexSkillNpmScriptContract.mjs', 35, 'AI 治理 Codex skill npm 脚本契约应独立维护 fenced npm run 可达性校验'),
];
