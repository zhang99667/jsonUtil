export const transformTypeScriptMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/jsonArraySampling.ts',
    maxLines: 110,
    reason: 'JSON 数组代表采样应保持为可复用纯函数，避免不同推断链路重复实现',
  },
  {
    file: 'frontend/src/utils/jsonSchemaInference.ts',
    maxLines: 400,
    reason: 'JSON Schema 推断入口复用数组采样与 Ajv 标准格式验证，后续增长应继续拆分模型合并与摘要职责',
  },
  {
    file: 'frontend/src/utils/jsonSchemaInference.test.ts',
    maxLines: 320,
    reason: 'JSON Schema 推断测试锁定结构合并、数组采样、可信摘要与标准格式边界',
  },
  {
    file: 'frontend/src/utils/jsonToTypeScriptInference.ts',
    maxLines: 300,
    reason: 'JSON 转 TypeScript 推断只维护模型合并、深度预算、数组采样和统计',
  },
  {
    file: 'frontend/src/utils/jsonToTypeScript.ts',
    maxLines: 225,
    reason: 'JSON 转 TypeScript 入口只维护类型命名、摘要和声明渲染',
  },
  {
    file: 'frontend/src/utils/jsonToTypeScript.test.ts',
    maxLines: 185,
    reason: 'JSON 转 TypeScript 测试锁定样本合并、预算边界和可信摘要',
  },
];
