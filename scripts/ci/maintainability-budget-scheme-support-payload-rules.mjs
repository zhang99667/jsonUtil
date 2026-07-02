import { schemeSupportPayloadNormalizationMaintainabilityBudgets } from './maintainability-budget-scheme-support-payload-normalization-rules.mjs';

export const schemeSupportPayloadMaintainabilityBudgets = [
  ...schemeSupportPayloadNormalizationMaintainabilityBudgets,
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
    file: 'frontend/src/utils/schemeJsonPayloadTypes.ts',
    maxLines: 40,
    reason: 'JSON payload 类型和 parse strategy 应保持稳定、集中导出',
  },
  {
    file: 'frontend/src/utils/schemeUrlShapes.ts',
    maxLines: 100,
    reason: 'URL 形态识别与原形状序列化应保持纯函数小模块',
  },
];
