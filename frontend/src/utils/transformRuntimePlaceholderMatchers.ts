import {
  includesQuery,
  isIssuePriorityQuery,
  shouldSearchLongSourceValue,
} from './transformReportFilters';
import type { TransformReportRuntimePlaceholder } from './transformRuntimePlaceholderTypes';

const PLACEHOLDER_SEARCH_TEXT = '占位符 运行时 placeholder';

export const matchesRuntimePlaceholder = (
  placeholder: TransformReportRuntimePlaceholder,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  isIssuePriorityQuery(normalizedQuery) ||
  includesQuery(placeholder.path, normalizedQuery) ||
  includesQuery(placeholder.sourcePath, normalizedQuery) ||
  (placeholder.sourceLabel ? includesQuery(placeholder.sourceLabel, normalizedQuery) : false) ||
  includesQuery(PLACEHOLDER_SEARCH_TEXT, normalizedQuery) ||
  includesQuery(placeholder.value, normalizedQuery) ||
  includesQuery(placeholder.description, normalizedQuery) ||
  (placeholder.sourceOriginalValue && shouldSearchLongSourceValue(normalizedQuery)
    ? includesQuery(placeholder.sourceOriginalValue, normalizedQuery)
    : false)
);
