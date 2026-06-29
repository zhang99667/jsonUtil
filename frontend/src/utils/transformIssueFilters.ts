import {
  includesQuery,
  isIssuePriorityQuery,
  shouldSearchLongSourceValue,
} from './transformReportFilters';
import type {
  TransformReportUnresolvedCandidate,
  TransformReportWarning,
} from './transformSummary';

const UNRESOLVED_SEARCH_TEXT = '待检查 未展开 线索 unresolved';
const WARNING_SEARCH_TEXT = '跳过 性能保护 warning skipped';

export const matchesReportWarning = (
  warning: TransformReportWarning,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  isIssuePriorityQuery(normalizedQuery) ||
  includesQuery(warning.path, normalizedQuery) ||
  (warning.sourceLabel ? includesQuery(warning.sourceLabel, normalizedQuery) : false) ||
  includesQuery(WARNING_SEARCH_TEXT, normalizedQuery) ||
  includesQuery(warning.message, normalizedQuery) ||
  includesQuery(warning.reasonLabel, normalizedQuery) ||
  includesQuery(warning.nextAction, normalizedQuery) ||
  (shouldSearchLongSourceValue(normalizedQuery) ? includesQuery(warning.originalValue, normalizedQuery) : false)
);

export const matchesUnresolvedCandidate = (
  candidate: TransformReportUnresolvedCandidate,
  normalizedQuery: string
): boolean => (
  !normalizedQuery ||
  isIssuePriorityQuery(normalizedQuery) ||
  includesQuery(candidate.path, normalizedQuery) ||
  (candidate.sourceLabel ? includesQuery(candidate.sourceLabel, normalizedQuery) : false) ||
  includesQuery(UNRESOLVED_SEARCH_TEXT, normalizedQuery) ||
  includesQuery(candidate.message, normalizedQuery) ||
  includesQuery(candidate.preview, normalizedQuery) ||
  includesQuery(candidate.reasonLabel, normalizedQuery) ||
  includesQuery(candidate.nextAction, normalizedQuery) ||
  (candidate.detectedType ? includesQuery(candidate.detectedType, normalizedQuery) : false) ||
  (shouldSearchLongSourceValue(normalizedQuery) ? includesQuery(candidate.originalValue, normalizedQuery) : false)
);
