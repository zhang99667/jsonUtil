const projectContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiProjectContractMaintainabilityBudgets = [
  projectContractBudget('scripts/ci/maintainability-budget-governance-ai-project-contract-rules.mjs', 10, 'AI 治理项目事实契约预算子表应只维护项目事实和版本事实契约条目'),
  projectContractBudget('scripts/ci/aiGovernanceProjectFactsContract.mjs', 85, 'AI 治理项目事实契约应独立维护真实配置到入口文档的事实漂移检查'),
  projectContractBudget('scripts/ci/aiGovernanceProjectVersionFactsContract.mjs', 65, 'AI 治理项目版本事实契约应独立维护依赖和 lock 版本到入口文档的漂移检查'),
];
