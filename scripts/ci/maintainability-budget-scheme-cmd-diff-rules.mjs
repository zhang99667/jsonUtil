export const schemeCmdDiffMaintainabilityBudgets = [
  { file: 'frontend/src/utils/cmdStructureDiff.ts', maxLines: 500, reason: 'CMD 结构对比逻辑应聚焦解析、归一化、diff 和候选排序，候选收集、raw source 解码与格式化展示继续拆到独立 helper' },
  { file: 'frontend/src/utils/cmdStructureValueDiff.ts', maxLines: 85, reason: 'CMD 参数值 diff 入口应只聚合路径行、source 等价和 value diff，不承载路径展开细节' },
  { file: 'frontend/src/utils/cmdStructureValueRows.ts', maxLines: 65, reason: 'CMD 参数值路径展开 helper 应独立维护对象、数组和转义 key 到路径行的纯派生' },
  { file: 'frontend/src/utils/cmdStructureValueFormatter.ts', maxLines: 55, reason: 'CMD 参数值展示 formatter 应独立维护稳定 stringify 和预览截断规则' },
  { file: 'frontend/src/utils/cmdStructureValueFormatter.test.ts', maxLines: 70, reason: 'CMD 参数值展示 formatter 测试只锁定稳定 stringify 和预览截断边界' },
  { file: 'frontend/src/utils/cmdStructureSourceEquivalence.ts', maxLines: 45, reason: 'CMD 结构化 source 等价判断应独立维护字符串与展开结构的归一化比较' },
  { file: 'frontend/src/utils/cmdStructureValueDiffTypes.ts', maxLines: 30, reason: 'CMD 参数值 diff 类型契约应独立维护路径行、值差异和比较结果结构' },
  { file: 'frontend/src/utils/cmdStructureDiffFormatter.ts', maxLines: 100, reason: 'CMD 结构差异报告格式化入口应只负责报告顺序和差异类型分发，段落 helper、路径折叠和解析排序逻辑不应回流' },
  { file: 'frontend/src/utils/cmdStructureDiffReportSections.ts', maxLines: 60, reason: 'CMD 结构差异报告段落 helper 应集中治理上下文、source 和路径分支展示文案' },
  { file: 'frontend/src/utils/cmdStructurePathBranches.ts', maxLines: 35, reason: 'CMD 结构路径分支折叠应保持独立纯函数，供 diff 报告和候选评分复用' },
];
