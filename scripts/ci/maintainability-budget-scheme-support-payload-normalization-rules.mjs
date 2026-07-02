export const schemeSupportPayloadNormalizationMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeJsonPayloadNormalizers.ts',
    maxLines: 100,
    reason: 'JSON payload HTML 引号、反斜杠引号和 loose JSON 修复应保持纯归一化模块',
  },
  {
    file: 'frontend/src/utils/schemeEscapedPayloads.ts',
    maxLines: 60,
    reason: 'JSON 斜杠和 Unicode ASCII 转义载荷识别应保持纯函数，避免回流到 Scheme 主流程',
  },
  {
    file: 'frontend/src/utils/schemeStructuredPayloadNormalization.ts',
    maxLines: 80,
    reason: 'Scheme 结构化载荷归一化规则表应集中维护顺序，避免 detect/actionable/decode 主流程重复分支',
  },
];
