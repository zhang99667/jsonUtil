export const schemeCmdCandidateMaintainabilityBudgets = [
  { file: 'frontend/src/utils/cmdStructureCandidates.ts', maxLines: 65, reason: 'CMD actual 候选入口应只编排 raw CMD 解码和结构化候选扫描 helper' },
  { file: 'frontend/src/utils/cmdStructureDecodedCandidates.ts', maxLines: 110, reason: 'CMD 已解码候选扫描应独立维护 actual 归一化、路径拼接和去重' },
  { file: 'frontend/src/utils/cmdStructureRawSource.ts', maxLines: 120, reason: '原始 response 中的 CMD 候选扫描与排序选择应保持短小，避免快速解码流程回流' },
  { file: 'frontend/src/utils/cmdStructureRawSourceDecoder.ts', maxLines: 150, reason: '原始 CMD 快速结构化解码应聚焦 source/URL 递归流程，JSON 值处理和 query 聚合继续沉淀到独立 helper' },
  { file: 'frontend/src/utils/cmdStructureRawQueryParams.ts', maxLines: 60, reason: '原始 CMD query 参数解析应独立维护 URLSearchParams 遍历、重复 key 聚合和 value parser 透传' },
  { file: 'frontend/src/utils/cmdStructureRawQueryParams.test.ts', maxLines: 70, reason: '原始 CMD query 参数解析测试只锁定问号前缀、parser 深度透传和重复 key 聚合' },
  { file: 'frontend/src/utils/cmdStructureRawJsonValue.ts', maxLines: 60, reason: '原始 CMD JSON 值解析与 unknown 到 JsonValue 转换应保持独立纯函数，避免快速解码流程膨胀' },
  { file: 'frontend/src/utils/cmdStructureRawSourceGuards.ts', maxLines: 80, reason: '原始 CMD 字段优先级、source 形态和结构化字段判断应保持纯 guard helper，避免解码流程回流' },
];
