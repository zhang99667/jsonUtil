const staticRetentionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const infraStaticRetentionMaintainabilityBudgets = [
  staticRetentionBudget('scripts/ci/check-frontend-static-retention.mjs', 45, '前端静态资源保留校验 CLI 应只组合配置检查、发布场景和输出'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionConfig.mjs', 35, '静态资源保留配置检查应只负责加载规则并收集缺失项'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionRules.mjs', 90, '静态资源保留规则表应集中维护 Docker/Compose/CI/Deploy 必备片段'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionScenario.mjs', 95, '静态资源保留场景应只维护临时发布 fixture、入口执行和产物断言'),
];
