const jsonSchemaExampleBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const jsonSchemaExampleMaintainabilityBudgets = [
  jsonSchemaExampleBudget('frontend/src/utils/jsonSchemaExample.ts', 700, 'Schema 示例入口只维护对象、数组、组合关键字、引用递归和最终校验编排'),
  jsonSchemaExampleBudget('frontend/src/utils/jsonSchemaExample.test.ts', 700, 'Schema 示例集成测试锁定关键字组合、生成结果和自校验契约'),
  jsonSchemaExampleBudget('frontend/src/utils/jsonSchemaExamplePrimitives.ts', 250, 'Schema 字符串、正则、字面量克隆和唯一字符串生成应保持纯函数'),
  jsonSchemaExampleBudget('frontend/src/utils/jsonSchemaExamplePrimitives.test.ts', 60, 'Schema 原始值测试锁定克隆、格式、长度、正则、枚举和唯一值边界'),
  jsonSchemaExampleBudget('frontend/src/utils/jsonSchemaExampleNumbers.ts', 100, 'Schema 数值 helper 只维护有限数读取、边界、倍数和唯一值候选'),
  jsonSchemaExampleBudget('frontend/src/utils/jsonSchemaExampleNumbers.test.ts', 50, 'Schema 数值测试锁定有限数、整数、边界、倍数和唯一值约束'),
  jsonSchemaExampleBudget('frontend/src/utils/jsonSchemaExamplePropertyNames.ts', 100, 'Schema 动态属性名 helper 只维护候选推导、约束校验和去重选择'),
  jsonSchemaExampleBudget('frontend/src/utils/jsonSchemaExamplePropertyNames.test.ts', 50, 'Schema 动态属性名测试锁定常量、枚举、正则、长度和候选选择'),
];
