const appStructureNavBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStructureNavMaintainabilityBudgets = [
  appStructureNavBudget('frontend/src/components/JsonTreePanel.tsx', 1250, '结构导航主面板应继续只编排 worker 状态、搜索、选中节点、图谱/列表和子组件接线，详情区和表格预览等重 UI 应逐步拆出'),
  appStructureNavBudget('frontend/src/components/JsonTreeGraphPanel.tsx', 180, '结构导航图谱面板只维护 SVG 渲染、节点配色、边路径和图谱节点选择入口'),
  appStructureNavBudget('frontend/src/components/JsonTreeGraphPanel.test.tsx', 160, '结构导航图谱面板测试只锁定摘要、截断态、选中态、点击和键盘确认装配'),
  appStructureNavBudget('frontend/src/components/JsonTreeArrayTablePreviewPanel.tsx', 120, '结构导航数组表格预览组件只维护表格摘要、列筛选、空列态和 JSON/CSV 复制入口'),
  appStructureNavBudget('frontend/src/components/JsonTreeArrayTablePreviewPanel.test.tsx', 110, '结构导航数组表格预览测试只锁定装配、筛选回调、复制回调和空列禁用态'),
];
