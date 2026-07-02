const staticRetentionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const infraStaticRetentionMaintainabilityBudgets = [
  staticRetentionBudget('scripts/ci/check-frontend-static-retention.mjs', 45, '前端静态资源保留校验 CLI 应只组合配置检查、发布场景和输出'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionConfig.mjs', 35, '静态资源保留配置检查应只负责加载规则并收集缺失项'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionRules.mjs', 25, '静态资源保留规则入口应只聚合 Docker、Compose、部署和 workflow 子规则表'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionDockerRules.mjs', 25, '静态资源保留 Docker 规则表应只维护镜像入口片段'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionComposeRules.mjs', 25, '静态资源保留 Compose 规则表应只维护环境变量和 volume 片段'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionDeployRules.mjs', 45, '静态资源保留部署规则表应只维护旧资源备份、恢复和公网巡检片段'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionWorkflowRules.mjs', 40, '静态资源保留 workflow 规则表应只维护 CI 和发布复查片段'),
  staticRetentionBudget('scripts/ci/frontendStaticRetentionScenario.mjs', 95, '静态资源保留场景应只维护临时发布 fixture、入口执行和产物断言'),
];
