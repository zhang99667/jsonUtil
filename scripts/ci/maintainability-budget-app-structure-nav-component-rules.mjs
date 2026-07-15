const appStructureNavComponentBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appStructureNavComponentMaintainabilityBudgets = [
  appStructureNavComponentBudget('frontend/src/components/JsonTreePanel.tsx', 650, '结构导航主面板只编排模型状态、搜索、选中节点、图谱/列表和子组件接线，线程生命周期及重 UI 已拆出后不应回涨'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeToolbar.tsx', 160, '结构导航工具栏只维护搜索输入、类型筛选、视图切换、复制结果入口和展开折叠装配'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeCopySearchResultsMenu.tsx', 90, '结构导航搜索结果复制菜单只维护启用/禁用状态和 JSON/Markdown/CSV 复制入口'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeSearchHistoryPanel.tsx', 85, '结构导航搜索历史条只维护历史项展示、填入、删除和清空入口'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeSelectedNodeDetailsPanel.tsx', 220, '结构导航选中节点详情面板只维护节点摘要、语义提示、复制动作和表格预览装配'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeGraphPanel.tsx', 180, '结构导航图谱面板只维护 SVG 渲染、节点配色、边路径和图谱节点选择入口'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeNodeListPanel.tsx', 150, '结构导航列表组件只维护节点行渲染、展开态、选中态、搜索高亮和 PATH 复制入口'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreePanelFooter.tsx', 60, '结构导航底部状态栏只维护加载态、匹配数量、容器数量和截断摘要文案'),
  appStructureNavComponentBudget('frontend/src/components/JsonTreeArrayTablePreviewPanel.tsx', 120, '结构导航数组表格预览组件只维护表格摘要、列筛选、空列态和 JSON/CSV 复制入口'),
];
