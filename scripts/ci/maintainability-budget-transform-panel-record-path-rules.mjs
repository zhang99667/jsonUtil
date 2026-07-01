export const transformPanelRecordPathMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/TransformReportRecordPathSections.tsx',
    maxLines: 140,
    reason: '深度解析展开记录路径与预览编排应集中治理，避免记录 section 重新承载路径行样式细节',
  },
  {
    file: 'frontend/src/components/TransformReportRecordPathRows.tsx',
    maxLines: 55,
    reason: '深度解析展开记录路径行列表应只负责标题、列表、更多提示和行级 props 透传，单行动作继续下沉',
  },
  {
    file: 'frontend/src/components/TransformReportRecordPathRow.tsx',
    maxLines: 50,
    reason: '深度解析展开记录单行展示应只负责路径、值展示和行级动作 props 透传，复制、定位和 Scheme 打开动作继续下沉',
  },
  {
    file: 'frontend/src/components/TransformReportRecordPathRowActions.tsx',
    maxLines: 75,
    reason: '深度解析展开记录路径行动作应集中治理动作顺序，按钮壳复用 TransformReportRecordActionButton',
  },
  {
    file: 'frontend/src/components/TransformReportCommandSchemaRows.tsx',
    maxLines: 90,
    reason: '深度解析 CMD Schema 路径列表应保持纯展示组件，复制和定位动作由上游注入',
  },
];
