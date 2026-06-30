export const transformPlaceholderSuggestionMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformPlaceholderSuggestions.ts',
    maxLines: 55,
    reason: '运行时占位符回填建议入口应只遍历 view 并组装 Map，单值建议生成留在 builder',
  },
  {
    file: 'frontend/src/utils/transformPlaceholderSuggestionBuilder.ts',
    maxLines: 60,
    reason: '运行时占位符单值建议生成应只组合别名、候选收集和唯一性判断',
  },
  {
    file: 'frontend/src/utils/transformPlaceholderSuggestionTypes.ts',
    maxLines: 30,
    reason: '运行时占位符回填建议 view 类型应独立集中，避免入口文件重新堆类型定义',
  },
  {
    file: 'frontend/src/utils/transformPlaceholderSuggestionRules.ts',
    maxLines: 90,
    reason: '运行时占位符别名和候选匹配规则应保持纯函数小模块',
  },
];
