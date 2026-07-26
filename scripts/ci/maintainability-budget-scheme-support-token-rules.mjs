export const schemeSupportTokenMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeJwt.ts',
    maxLines: 55,
    reason: 'JWT 检测与解码应独立于 Base64 公开入口，避免格式兼容逻辑继续挤压主入口',
  },
];
