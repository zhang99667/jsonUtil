const hookContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiHookContractMaintainabilityBudgets = [
  hookContractBudget('scripts/ci/maintainability-budget-governance-ai-hook-contract-rules.mjs', 12, 'Codex hook 预算子表应只维护配置、runtime、契约、case 和负例预算'),
  hookContractBudget('.codex/hooks.json', 30, 'Codex project hook 配置应只注册单一 SessionStart advisory'),
  hookContractBudget('.codex/hooks/session-start-governance.mjs', 90, 'Codex SessionStart runtime 应保持有界、只读、固定输出且不阻断会话'),
  hookContractBudget('scripts/ci/aiGovernanceCodexHooks.mjs', 150, 'Codex hook 契约应锁定闭字段配置、已审计 runtime 和最小能力面'),
  hookContractBudget('scripts/ci/aiGovernanceCodexHookCaseDescriptors.mjs', 20, 'Codex hook case descriptor 应只绑定 component case 与固定测试'),
  hookContractBudget('scripts/ci/aiGovernanceCodexHooks.test.mjs', 190, 'Codex hook 测试应覆盖路径、输入上限、隐私、symlink、扩权和固定 advisory'),
];
