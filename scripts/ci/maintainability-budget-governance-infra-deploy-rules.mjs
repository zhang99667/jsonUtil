export const governanceInfraDeployMaintainabilityBudgets = [
  { file: 'scripts/ci/maintainability-budget-infra-deploy-rules.mjs', maxLines: 15, reason: '部署预算聚合入口应只组合检查器和运行脚本子表' },
  { file: 'scripts/ci/maintainability-budget-infra-deploy-checker-rules.mjs', maxLines: 20, reason: '部署检查器预算规则应只维护 bash、heredoc 和 workflow run 检查条目' },
  { file: 'scripts/ci/maintainability-budget-infra-deploy-runtime-rules.mjs', maxLines: 25, reason: '部署运行脚本预算规则应只维护本地、远端和静态资源入口脚本条目' },
  { file: 'scripts/ci/maintainability-budget-governance-infra-deploy-rules.mjs', maxLines: 15, reason: '部署预算治理规则应只维护部署子表自身预算' },
];
