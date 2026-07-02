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
