const schemeViewerCommandComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerCommandComponentMaintainabilityBudgets = [
  schemeViewerCommandComponentBudget('SchemeViewerCommandSummaryPanel.tsx', 65, 'Scheme CMD 结构摘要面板只负责外框组合，schema、参数和内部线索展示下沉到 badge 子组件'),
  schemeViewerCommandComponentBudget('SchemeViewerCommandSummaryPanel.test.tsx', 95, 'Scheme CMD 结构摘要面板测试只覆盖空态和子组件组合后的完整摘要语义'),
  schemeViewerCommandComponentBudget('SchemeViewerCommandSchemaBadges.tsx', 75, 'Scheme CMD Schema badge 只负责主 schema、数量和 Top Schema 展示'),
  schemeViewerCommandComponentBudget('SchemeViewerCommandSchemaBadges.test.tsx', 90, 'Scheme CMD Schema badge 测试只覆盖主 schema、数量、Top Schema 和截断'),
  schemeViewerCommandComponentBudget('SchemeViewerCommandParamBadges.tsx', 55, 'Scheme CMD 参数 badge 只负责参数数量、key 上限和剩余数量展示'),
  schemeViewerCommandComponentBudget('SchemeViewerCommandParamBadges.test.tsx', 60, 'Scheme CMD 参数 badge 测试只覆盖参数数量、前 6 个 key 和剩余数量'),
  schemeViewerCommandComponentBudget('SchemeViewerCommandInsightBadges.tsx', 65, 'Scheme CMD 内部线索 badge 只负责 cmd/ext/Base64 后缀线索展示'),
  schemeViewerCommandComponentBudget('SchemeViewerCommandInsightBadges.test.tsx', 70, 'Scheme CMD 内部线索 badge 测试只覆盖三类线索和空态'),
];
