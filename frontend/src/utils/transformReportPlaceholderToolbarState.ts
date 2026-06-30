export interface TransformReportPlaceholderToolbarStateInput {
  filteredPlaceholderCount: number;
  isPlaceholderTruncated: boolean;
  hasTemplateFillTarget: boolean;
  hasPlaceholderFillTemplate: boolean;
  isFilterPending: boolean;
  formatTemplateFillTitle: (readyTitle: string) => string;
}

export interface TransformReportPlaceholderToolbarState {
  filteredPlaceholderCount: number;
  isPlaceholderTruncated: boolean;
  canShowOpenTemplateFill: boolean;
  isPlaceholderFillTemplateDisabled: boolean;
  isCopyPlaceholderReportDisabled: boolean;
  openTemplateFillTitle: string;
  copyTemplateTitle: string;
  copyPlaceholderReportTitle: string;
}

export const buildTransformReportPlaceholderToolbarState = ({
  filteredPlaceholderCount,
  isPlaceholderTruncated,
  hasTemplateFillTarget,
  hasPlaceholderFillTemplate,
  isFilterPending,
  formatTemplateFillTitle,
}: TransformReportPlaceholderToolbarStateInput): TransformReportPlaceholderToolbarState => ({
  filteredPlaceholderCount,
  isPlaceholderTruncated,
  canShowOpenTemplateFill: hasTemplateFillTarget,
  isPlaceholderFillTemplateDisabled: !hasPlaceholderFillTemplate || isFilterPending,
  isCopyPlaceholderReportDisabled: isFilterPending,
  openTemplateFillTitle: formatTemplateFillTitle('把当前筛选下的运行时占位符回填模板填入模板填充面板'),
  copyTemplateTitle: formatTemplateFillTitle('复制当前筛选下的运行时占位符回填模板'),
  copyPlaceholderReportTitle: isFilterPending
    ? '筛选结果仍在更新，请稍后复制占位符摘要'
    : '复制当前筛选下的运行时占位符摘要',
});
