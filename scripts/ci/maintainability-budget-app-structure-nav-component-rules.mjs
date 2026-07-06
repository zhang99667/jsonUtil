const appStructureNavComponentBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStructureNavComponentMaintainabilityBudgets = [
  appStructureNavComponentBudget('frontend/src/components/JsonTreePanel.tsx', 1050, '结构导航主面板应继续只编排 worker 状态、搜索、选中节点、图谱/列表和子组件接线，详情区等重 UI 已拆出后不应回涨'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeSelectedNodeDetailsPanel.tsx', 220, '结构导航选中节点详情面板只维护节点摘要、语义提示、复制动作和表格预览装配'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeGraphPanel.tsx', 180, '结构导航图谱面板只维护 SVG 渲染、节点配色、边路径和图谱节点选择入口'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeArrayTablePreviewPanel.tsx', 120, '结构导航数组表格预览组件只维护表格摘要、列筛选、空列态和 JSON/CSV 复制入口'),
];
