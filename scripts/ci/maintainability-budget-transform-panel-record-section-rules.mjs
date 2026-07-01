import { transformPanelRecordPathMaintainabilityBudgets } from './maintainability-budget-transform-panel-record-path-rules.mjs';

const recordSectionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelRecordSectionMaintainabilityBudgets = [
  recordSectionBudget('frontend/src/components/TransformReportRecordsSection.tsx', 150, '深度解析展开记录区域应保持记录级编排，头部、标签、路径和预览展示应继续下沉到专用组件'),
  recordSectionBudget('frontend/src/components/TransformReportRecordHeader.tsx', 70, '深度解析展开记录头部应只负责来源、路径和右侧动作区装配'),
  recordSectionBudget('frontend/src/components/TransformReportRecordHeaderActions.tsx', 90, '深度解析展开记录头部动作区应只装配通用动作和可选入口，cmdHandler 动作组继续下沉'),
  recordSectionBudget('frontend/src/components/TransformReportRecordActionButton.tsx', 35, '深度解析展开记录动作按钮壳应只维护 button 属性透传和 data-tour 兼容'),
  recordSectionBudget('frontend/src/components/transformReportRecordCmdActionButtons.tsx', 65, '深度解析记录 cmdHandler 动作按钮组应集中维护聚焦复制文案、对比包和对比入口'),
  recordSectionBudget('frontend/src/components/TransformReportRecordBadges.tsx', 80, '深度解析展开记录标签和洞察 chip 应保持纯展示组件，避免记录 section 回涨'),
  ...transformPanelRecordPathMaintainabilityBudgets,
  recordSectionBudget('frontend/src/components/TransformReportCmdHandlerSummary.tsx', 70, '深度解析 cmdHandler 摘要应保持纯展示组件，筛选动作由上游注入'),
];
