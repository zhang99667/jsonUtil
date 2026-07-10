const projectContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiProjectContractMaintainabilityBudgets = [
  projectContractBudget('scripts/ci/maintainability-budget-governance-ai-project-contract-rules.mjs', 15, 'AI 治理项目事实契约预算子表应只维护项目事实和版本事实契约条目'),
  projectContractBudget('scripts/ci/aiGovernanceProjectFactsContract.mjs', 15, 'AI 治理项目事实契约应只组合数据库事实和版本事实契约'),
  projectContractBudget('scripts/ci/aiGovernanceProjectDatabaseFactsContract.mjs', 80, 'AI 治理项目数据库事实契约应独立维护真实配置到入口文档的数据库事实漂移检查'),
  projectContractBudget('scripts/ci/aiGovernanceProjectDatabaseFactRules.mjs', 25, 'AI 治理项目数据库事实规则应独立维护数据库来源、入口目标和识别模式'),
  projectContractBudget('scripts/ci/aiGovernanceProjectVersionFactsContract.mjs', 70, 'AI 治理项目版本事实契约应独立维护依赖和 lock 版本到入口文档的漂移检查'),
  projectContractBudget('scripts/ci/aiGovernanceProjectVersionFactRules.mjs', 45, 'AI 治理项目版本事实规则应独立维护可反查依赖清单和不可验证版本片段'),
  projectContractBudget('scripts/ci/aiGovernanceProjectVersionFactSources.mjs', 35, 'AI 治理项目版本事实来源 helper 应独立维护 package、pom 和 lock 主版本解析'),
  projectContractBudget('scripts/ci/aiGovernanceProjectVersionFactTargets.mjs', 35, 'AI 治理项目版本事实目标 helper 应独立维护入口文档缺失、过期版本和不可验证说明扫描'),
];
