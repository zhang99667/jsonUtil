const placeholderComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const transformPanelPlaceholderSectionMaintainabilityBudgets = [
  placeholderComponentBudget('TransformReportPlaceholdersSection.tsx', 85, '深度解析运行时占位符 section 应只负责工具栏、分组卡片、单行组件装配和行级 props 透传'),
  placeholderComponentBudget('TransformReportPlaceholderToolbar.tsx', 90, '深度解析运行时占位符工具栏应集中治理摘要计数、截断提示和模板复制按钮矩阵'),
  placeholderComponentBudget('TransformReportPlaceholderGroupCard.tsx', 70, '深度解析运行时占位符分组卡片应只负责分组摘要、来源预览和筛选入口'),
  placeholderComponentBudget('TransformReportPlaceholderRow.tsx', 60, '深度解析运行时占位符单行应只负责来源路径、来源值和动作组件装配'),
  placeholderComponentBudget('TransformReportPlaceholderRowActions.tsx', 90, '深度解析运行时占位符动作组件应集中治理复制、定位和 Scheme 打开按钮矩阵'),
];
