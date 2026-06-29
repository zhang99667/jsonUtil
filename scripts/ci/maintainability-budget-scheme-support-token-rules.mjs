export const schemeSupportTokenMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeJwt.ts',
    maxLines: 50,
    reason: 'JWT 解码应独立于 Base64 公开入口，避免格式兼容逻辑继续挤压主入口',
  },
];
