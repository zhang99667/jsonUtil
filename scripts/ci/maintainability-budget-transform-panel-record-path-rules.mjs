const pathBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelRecordPathMaintainabilityBudgets = [
  pathBudget('frontend/src/components/TransformReportRecordPathSections.tsx', 65, '深度解析展开记录路径与预览入口应只负责配置生成、区块渲染和预览行编排'),
  pathBudget('frontend/src/components/transformReportRecordPathSectionConfigs.tsx', 115, '深度解析展开记录路径区块配置应集中维护三类路径业务配置和路径动作契约透传'),
  pathBudget('frontend/src/components/transformReportRecordPathSectionHelpers.tsx', 75, '深度解析展开记录路径区块 helper 应只负责共享行样式、更多提示和 section props 装配'),
  pathBudget('frontend/src/components/TransformReportRecordPathRows.tsx', 55, '深度解析展开记录路径行列表应只负责标题、列表、更多提示和行级 props 透传，单行动作继续下沉'),
  pathBudget('frontend/src/components/TransformReportRecordPathRow.tsx', 50, '深度解析展开记录单行展示应只负责路径、值展示和行级动作 props 透传，复制、定位和 Scheme 打开动作继续下沉'),
  pathBudget('frontend/src/components/TransformReportRecordPathRowActions.tsx', 75, '深度解析展开记录路径行动作应集中治理动作顺序，按钮壳复用 TransformReportActionButton'),
  pathBudget('frontend/src/components/TransformReportCommandSchemaRows.tsx', 90, '深度解析 CMD Schema 路径列表应保持纯展示组件，复制和定位动作由上游注入'),
];
