export const schemeSupportMetadataMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeMetadata.ts',
    maxLines: 820,
    reason: 'Scheme 元数据门面应聚焦迭代洞察聚合、命令摘要和兼容导出，字段规则与 source 解析不得回流',
  },
  {
    file: 'frontend/src/utils/schemeMetadata.test.ts',
    maxLines: 850,
    reason: 'Scheme 元数据门面测试只保留跨职责兼容用例，规则与 source 解析边界优先进入专职测试',
  },
  {
    file: 'frontend/src/utils/schemeMetadataFieldRules.ts',
    maxLines: 220,
    reason: 'Scheme 元数据字段规则应保持无依赖纯判定模块，新增字段先复用名称和后缀规则',
  },
  {
    file: 'frontend/src/utils/schemeMetadataFieldRules.test.ts',
    maxLines: 140,
    reason: 'Scheme 元数据字段规则测试应使用矩阵覆盖名称、后缀和优先级，避免重复逐字段断言',
  },
  {
    file: 'frontend/src/utils/schemeMetadataSourceShape.ts',
    maxLines: 220,
    reason: 'Scheme source 形态解析应复用 query、日志字段和 JSON helper，避免重复正则与切分逻辑',
  },
  {
    file: 'frontend/src/utils/schemeMetadataSourceShape.test.ts',
    maxLines: 180,
    reason: 'Scheme source 解析测试应聚焦 JSON、URL、query、日志、Base64、重复参数与异常回退边界',
  },
  {
    file: 'frontend/src/utils/schemeMetadataSourceShapeFacade.test.ts',
    maxLines: 100,
    reason: 'Scheme source 兼容门面测试应只锁定导出包装、数组对齐和非法来源安全回退',
  },
  { file: 'frontend/src/utils/schemeMetadataCmdHandlerWrapper.ts', maxLines: 120, reason: 'Scheme CMD 参数包装器应保持迭代遍历、source 对齐和安全属性写入边界' },
];
