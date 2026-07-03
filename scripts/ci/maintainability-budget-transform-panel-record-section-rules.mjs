import { transformPanelRecordPathMaintainabilityBudgets } from './maintainability-budget-transform-panel-record-path-rules.mjs';

const recordSectionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const transformPanelRecordSectionMaintainabilityBudgets = [
  recordSectionBudget('frontend/src/components/TransformReportRecordsSection.tsx', 110, '深度解析展开记录区域应保持记录级编排，记录动作和 CMD 对比状态通过契约对象注入'),
  recordSectionBudget('frontend/src/components/TransformReportRecordSectionContracts.ts', 55, '深度解析展开记录动作、路径动作和 CMD 对比状态契约应集中维护，避免 section props 再次摊平'),
  recordSectionBudget('frontend/src/components/transformReportRecordSectionBindings.ts', 125, '深度解析展开记录 action 绑定和 CMD 对比状态桥接应集中维护，避免主面板再次堆叠交互闭包'),
  recordSectionBudget('frontend/src/components/transformReportRecordSectionBindings.test.ts', 160, '深度解析展开记录绑定测试只覆盖打开首个对比、候选切换、复制映射、可选入口和候选惰性读取边界'),
  recordSectionBudget('frontend/src/components/transformReportRecordSectionBindingsTestFixture.ts', 75, '深度解析展开记录绑定 fixture 只维护 copy workflow、状态 spy 和默认 bindings 装配'),
  recordSectionBudget('frontend/src/components/TransformReportRecordHeader.tsx', 70, '深度解析展开记录头部应只负责来源、路径和右侧动作区装配'),
  recordSectionBudget('frontend/src/components/TransformReportRecordHeaderActions.tsx', 90, '深度解析展开记录头部动作区应只装配通用动作和可选入口，cmdHandler 动作组继续下沉'),
  recordSectionBudget('frontend/src/components/TransformReportActionButton.tsx', 55, '深度解析报告动作按钮壳应集中维护复制、定位、Scheme 和对比入口的 tone 样式'),
  recordSectionBudget('frontend/src/components/transformReportRecordCmdActionButtons.tsx', 65, '深度解析记录 cmdHandler 动作按钮组应集中维护聚焦复制文案、对比包和对比入口'),
  recordSectionBudget('frontend/src/components/TransformReportRecordBadges.tsx', 80, '深度解析展开记录标签和洞察 chip 应保持纯展示组件，避免记录 section 回涨'),
  ...transformPanelRecordPathMaintainabilityBudgets,
  recordSectionBudget('frontend/src/components/TransformReportCmdHandlerSummary.tsx', 70, '深度解析 cmdHandler 摘要应保持纯展示组件，筛选动作由上游注入'),
];
