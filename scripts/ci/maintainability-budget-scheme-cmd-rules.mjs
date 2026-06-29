export const schemeCmdMaintainabilityBudgets = [
  { file: 'frontend/src/utils/cmdStructureDiff.ts', maxLines: 500, reason: 'CMD 结构对比逻辑应聚焦解析、归一化、diff 和候选排序，候选收集、raw source 解码与格式化展示继续拆到独立 helper' },
  { file: 'frontend/src/utils/cmdStructureCandidates.ts', maxLines: 140, reason: 'CMD actual 候选收集应保持纯扫描与去重 helper，避免 diff 和报告展示逻辑回流' },
  { file: 'frontend/src/utils/cmdStructureDiffFormatter.ts', maxLines: 100, reason: 'CMD 结构差异报告格式化入口应只负责报告顺序和差异类型分发，段落 helper、路径折叠和解析排序逻辑不应回流' },
  { file: 'frontend/src/utils/cmdStructureDiffReportSections.ts', maxLines: 60, reason: 'CMD 结构差异报告段落 helper 应集中治理上下文、source 和路径分支展示文案' },
  { file: 'frontend/src/utils/cmdStructurePathBranches.ts', maxLines: 35, reason: 'CMD 结构路径分支折叠应保持独立纯函数，供 diff 报告和候选评分复用' },
  { file: 'frontend/src/utils/cmdStructureRawSource.ts', maxLines: 120, reason: '原始 response 中的 CMD 候选扫描与排序选择应保持短小，避免快速解码流程回流' },
  { file: 'frontend/src/utils/cmdStructureRawSourceDecoder.ts', maxLines: 165, reason: '原始 CMD 快速结构化解码应聚焦 URL/query 递归流程，JSON 值处理应沉淀到独立 helper' },
  { file: 'frontend/src/utils/cmdStructureRawJsonValue.ts', maxLines: 60, reason: '原始 CMD JSON 值解析与 unknown 到 JsonValue 转换应保持独立纯函数，避免快速解码流程膨胀' },
  { file: 'frontend/src/utils/cmdStructureRawSourceGuards.ts', maxLines: 80, reason: '原始 CMD 字段优先级、source 形态和结构化字段判断应保持纯 guard helper，避免解码流程回流' },
];
