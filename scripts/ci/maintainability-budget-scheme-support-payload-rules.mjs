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
    maxLines: 15,
    reason: 'JSON payload 类型应复用公共 JsonValue，只保留领域别名、解析策略和元信息',
  },
  {
    file: 'frontend/src/utils/schemeJsonPayloads.test.ts',
    maxLines: 75,
    reason: 'JSON payload 测试应锁定严格、宽松、转义修复和非有限数值拒绝边界',
  },
  {
    file: 'frontend/src/utils/schemeUrlShapes.ts',
    maxLines: 110,
    reason: 'URL 形态识别、共享解析上下文与原形状序列化应保持纯函数小模块',
  },
];
