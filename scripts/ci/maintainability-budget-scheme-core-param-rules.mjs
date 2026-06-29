export const schemeCoreParamMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeParamDecodeStageBuilder.ts',
    maxLines: 80,
    reason: 'Scheme 参数单条 stage 构造、修复提示和可逆性判断应保持独立，避免回流 query/hash 扫描入口',
  },
  {
    file: 'frontend/src/utils/schemeParamDecodeStages.ts',
    maxLines: 130,
    reason: 'Scheme 参数分层证据扫描应聚焦 query/hash/log-field 来源编排，单条 stage 构造应沉淀到 builder',
  },
];
