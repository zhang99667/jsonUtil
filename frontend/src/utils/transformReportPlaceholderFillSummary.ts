import type { TransformPlaceholderFillTemplate } from './transformSummary';

export interface PlaceholderFillSummary {
  total: number;
  filled: number;
  suggested: number;
  pending: number;
}

export const buildPlaceholderFillSummary = (
  template: TransformPlaceholderFillTemplate | null
): PlaceholderFillSummary | null => {
  if (!template || template.placeholderDetails.length === 0) return null;

  const filled = template.placeholderDetails.filter(detail => detail.replacement.trim().length > 0).length;
  const suggested = template.placeholderDetails.filter(detail => Boolean(detail.suggestion)).length;
  const total = template.placeholderDetails.length;

  return {
    total,
    filled,
    suggested,
    pending: Math.max(total - filled, 0),
  };
};

export const formatPlaceholderFillTitle = (baseTitle: string, summary: PlaceholderFillSummary | null): string => {
  if (!summary) return baseTitle;

  const parts = [
    `已预填 ${summary.filled}/${summary.total}`,
    `候选 ${summary.suggested}`,
    `待补 ${summary.pending}`,
  ];
  return `${baseTitle}（${parts.join('，')}）`;
};

export const getPlaceholderFillTemplateTitle = (
  readyTitle: string,
  hasTemplateJsonText: boolean,
  summary: PlaceholderFillSummary | null,
  isFilterPending: boolean
): string => {
  if (isFilterPending) return '筛选结果仍在更新，请稍后操作占位符回填模板';
  if (!hasTemplateJsonText) return '当前筛选没有可用的运行时占位符回填模板';
  return formatPlaceholderFillTitle(readyTitle, summary);
};
