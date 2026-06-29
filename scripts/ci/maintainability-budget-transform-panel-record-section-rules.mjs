import { transformPanelRecordPathMaintainabilityBudgets } from './maintainability-budget-transform-panel-record-path-rules.mjs';

export const transformPanelRecordSectionMaintainabilityBudgets = [
  {
    file: 'frontend/src/components/TransformReportRecordsSection.tsx',
    maxLines: 150,
    reason: '深度解析展开记录区域应保持记录级编排，头部、标签、路径和预览展示应继续下沉到专用组件',
  },
  {
    file: 'frontend/src/components/TransformReportRecordHeader.tsx',
    maxLines: 130,
    reason: '深度解析展开记录头部应只负责路径状态、复制、定位和 Scheme 打开动作',
  },
  {
    file: 'frontend/src/components/TransformReportRecordBadges.tsx',
    maxLines: 80,
    reason: '深度解析展开记录标签和洞察 chip 应保持纯展示组件，避免记录 section 回涨',
  },
  ...transformPanelRecordPathMaintainabilityBudgets,
  {
    file: 'frontend/src/components/TransformReportCmdHandlerSummary.tsx',
    maxLines: 70,
    reason: '深度解析 cmdHandler 摘要应保持纯展示组件，筛选动作由上游注入',
  },
];
