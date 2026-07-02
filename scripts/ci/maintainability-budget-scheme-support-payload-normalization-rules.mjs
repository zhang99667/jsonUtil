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
    maxLines: 65,
    reason: 'Scheme 结构化载荷归一化规则表应集中维护顺序，类型契约留在独立 types 文件',
  },
  {
    file: 'frontend/src/utils/schemeStructuredPayloadNormalizationTypes.ts',
    maxLines: 45,
    reason: 'Scheme 结构化载荷归一化类型契约应独立维护，避免规则表文件随类型增长回涨',
  },
];
