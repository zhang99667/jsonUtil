export const transformJsonValueMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/jsonValueGuards.ts',
    maxLines: 65,
    reason: 'JSON 值守卫与共享解析入口应统一维护有限数值、深层容器和语法失败边界',
  },
  {
    file: 'frontend/src/utils/jsonValueGuards.test.ts',
    maxLines: 55,
    reason: 'JSON 值守卫测试应锁定标量、容器、循环、深链和解析失败语义',
  },
  {
    file: 'frontend/src/utils/jsonValueConsumerBoundary.test.ts',
    maxLines: 65,
    reason: 'JSON 值消费边界测试锁定核心转换、Scheme 展示与结构导航拒绝非有限数值',
  },
  {
    file: 'frontend/src/utils/jsonValueStringify.ts',
    maxLines: 100,
    reason: 'JSON 值序列化只维护栈安全遍历、标准缩进和循环检测边界',
  },
  {
    file: 'frontend/src/utils/jsonValueStringify.test.ts',
    maxLines: 55,
    reason: 'JSON 值序列化测试锁定标准输出、深层结构、特殊键和循环失败语义',
  },
];
