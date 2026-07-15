const commandRuleBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCommandRuleContractMaintainabilityBudgets = [
  commandRuleBudget('scripts/ci/maintainability-budget-governance-ai-command-rule-contract-rules.mjs', 12, 'Codex command rule 预算子表应只维护 policy、契约、descriptor 与负例预算'),
  commandRuleBudget('.codex/rules/default.rules', 130, 'Codex project command policy 应只维护 prompt-only prefix rules 与 inline examples'),
  commandRuleBudget('scripts/ci/aiGovernanceCodexCommandRules.mjs', 150, 'Codex command rule 契约应只维护 canonical policy、普通文件与有界内容检查'),
  commandRuleBudget('scripts/ci/aiGovernanceCodexCommandRuleCaseDescriptors.mjs', 20, 'Codex command rule descriptor 应只绑定 component-only case 与固定测试'),
  commandRuleBudget('scripts/ci/aiGovernanceCodexCommandRules.test.mjs', 110, 'Codex command rule 测试应锁 prompt-only、canonical 漂移、symlink 和超限负例'),
];
