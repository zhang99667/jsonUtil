export const schemeCoreParamMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeParamDecodeStageBuilder.ts',
    maxLines: 80,
    reason: 'Scheme 参数单条 stage 构造、修复提示和可逆性判断应保持独立，避免回流 query/hash 扫描入口',
  },
  {
    file: 'frontend/src/utils/schemeParamDecodeStagePairs.ts',
    maxLines: 70,
    reason: 'Scheme 参数 pair 扫描应独立维护上限、key/value 解码和单条 stage 构造循环',
  },
  {
    file: 'frontend/src/utils/schemeParamDecodeStages.ts',
    maxLines: 95,
    reason: 'Scheme 参数分层证据扫描应聚焦 query/hash/log-field 来源编排，pair 扫描和单条 stage 构造应下沉到 helper',
  },
];
