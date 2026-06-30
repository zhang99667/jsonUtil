export const infraStaticRetentionMaintainabilityBudgets = [
  {
    file: 'scripts/ci/check-frontend-static-retention.mjs',
    maxLines: 45,
    reason: '前端静态资源保留校验 CLI 应只组合配置检查、发布场景和输出',
  },
  {
    file: 'scripts/ci/frontendStaticRetentionConfig.mjs',
    maxLines: 35,
    reason: '静态资源保留配置检查应只负责加载规则并收集缺失项',
  },
  {
    file: 'scripts/ci/frontendStaticRetentionRules.mjs',
    maxLines: 90,
    reason: '静态资源保留规则表应集中维护 Docker/Compose/CI/Deploy 必备片段',
  },
  {
    file: 'scripts/ci/frontendStaticRetentionScenario.mjs',
    maxLines: 95,
    reason: '静态资源保留场景应只维护临时发布 fixture、入口执行和产物断言',
  },
];
