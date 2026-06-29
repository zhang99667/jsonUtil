export const schemeSupportPayloadMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeJsonPayloads.ts',
    maxLines: 35,
    reason: 'JSON payload 公开入口应只保留兼容导出，解析编排和归一化规则留在专用模块',
  },
  {
    file: 'frontend/src/utils/schemeJsonPayloadParser.ts',
    maxLines: 70,
    reason: 'JSON payload 解析策略编排和 parse meta 应独立于公开入口',
  },
  {
    file: 'frontend/src/utils/schemeJsonPayloadNormalizers.ts',
    maxLines: 100,
    reason: 'JSON payload HTML 引号、反斜杠引号和 loose JSON 修复应保持纯归一化模块',
  },
  {
    file: 'frontend/src/utils/schemeJsonPayloadTypes.ts',
    maxLines: 40,
    reason: 'JSON payload 类型和 parse strategy 应保持稳定、集中导出',
  },
  {
    file: 'frontend/src/utils/schemeEscapedPayloads.ts',
    maxLines: 60,
    reason: 'JSON 斜杠和 Unicode ASCII 转义载荷识别应保持纯函数，避免回流到 Scheme 主流程',
  },
  {
    file: 'frontend/src/utils/schemeUrlShapes.ts',
    maxLines: 100,
    reason: 'URL 形态识别与原形状序列化应保持纯函数小模块',
  },
];
