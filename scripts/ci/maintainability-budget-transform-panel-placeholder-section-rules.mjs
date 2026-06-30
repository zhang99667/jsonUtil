const placeholderComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const transformPanelPlaceholderSectionMaintainabilityBudgets = [
  placeholderComponentBudget('TransformReportPlaceholdersSection.tsx', 35, '深度解析运行时占位符 section 应只负责工具栏、分组列表和行列表装配'),
  placeholderComponentBudget('TransformReportPlaceholdersSectionTypes.ts', 25, '深度解析运行时占位符 section props 契约应独立维护，避免渲染装配文件回涨'),
  placeholderComponentBudget('TransformReportPlaceholderToolbar.tsx', 90, '深度解析运行时占位符工具栏应集中治理摘要计数、截断提示和模板复制按钮矩阵'),
  placeholderComponentBudget('TransformReportPlaceholderGroupsList.tsx', 40, '深度解析运行时占位符分组列表应只负责分组卡片遍历和筛选动作透传'),
  placeholderComponentBudget('TransformReportPlaceholderGroupCard.tsx', 70, '深度解析运行时占位符分组卡片应只负责分组摘要、来源预览和筛选入口'),
  placeholderComponentBudget('TransformReportPlaceholderRowsList.tsx', 35, '深度解析运行时占位符行列表应只负责占位符行遍历和行级 props 透传'),
  placeholderComponentBudget('TransformReportPlaceholderRow.tsx', 60, '深度解析运行时占位符单行应只负责来源路径、来源值和动作组件装配'),
  placeholderComponentBudget('TransformReportPlaceholderRowActions.tsx', 90, '深度解析运行时占位符动作组件应集中治理复制、定位和 Scheme 打开按钮矩阵'),
];
