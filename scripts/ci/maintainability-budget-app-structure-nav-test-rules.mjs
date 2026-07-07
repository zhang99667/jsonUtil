const appStructureNavTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStructureNavTestMaintainabilityBudgets = [
  appStructureNavTestBudget('frontend/src/components/JsonTreeToolbar.test.tsx', 110, '结构导航工具栏测试只锁定搜索、类型筛选、视图切换、复制菜单装配和展开折叠状态'),
  appStructureNavTestBudget('frontend/src/components/JsonTreeCopySearchResultsMenu.test.tsx', 70, '结构导航搜索结果复制菜单测试只锁定启用/禁用状态、可访问文案和三种复制回调'),
  appStructureNavTestBudget('frontend/src/components/JsonTreeSearchHistoryPanel.test.tsx', 60, '结构导航搜索历史条测试只锁定空态、历史填入、删除和清空回调'),
  appStructureNavTestBudget('frontend/src/components/JsonTreeSelectedNodeDetailsPanel.test.tsx', 180, '结构导航选中节点详情测试只锁定基础操作、语义提示、容器动作和表格预览接线'),
  appStructureNavTestBudget('frontend/src/components/JsonTreeGraphPanel.test.tsx', 160, '结构导航图谱面板测试只锁定摘要、截断态、选中态、点击和键盘确认装配'),
  appStructureNavTestBudget('frontend/src/components/JsonTreeArrayTablePreviewPanel.test.tsx', 110, '结构导航数组表格预览测试只锁定装配、筛选回调、复制回调和空列禁用态'),
];
