import { governanceInfraAssetsMaintainabilityBudgets } from './maintainability-budget-governance-infra-assets-rules.mjs';
import { governanceInfraDeployMaintainabilityBudgets } from './maintainability-budget-governance-infra-deploy-rules.mjs';

export const governanceInfraMaintainabilityBudgets = [
  ...governanceInfraDeployMaintainabilityBudgets,
  ...governanceInfraAssetsMaintainabilityBudgets,
  { file: 'scripts/ci/maintainability-budget-infra-rules.mjs', maxLines: 30, reason: '基础设施预算规则应只保留前端构建配置、部署脚本、静态保留和公网资源巡检子表' },
  { file: 'scripts/ci/maintainability-budget-governance-infra-rules.mjs', maxLines: 20, reason: '基础设施治理预算入口应只组合部署和资源治理子表' },
];
