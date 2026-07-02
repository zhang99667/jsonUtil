import {
  collectTransformReportFilterViewMatches,
  hasTransformReportFilterViewMatches,
} from './transformReportFilterViewMatches';
import { buildTransformReportFilterViewPatch } from './transformReportFilterViewPatches';
import type { TransformReportFilterOptions } from './transformReportFilters';
import type { TransformReportRecord } from './transformSummary';

export const buildFilteredRecordView = (
  record: TransformReportRecord,
  normalizedQuery: string,
  options: TransformReportFilterOptions
): TransformReportRecord => {
  if (!normalizedQuery) return record;

  const matches = collectTransformReportFilterViewMatches(record, normalizedQuery, options);
  if (!hasTransformReportFilterViewMatches(matches)) return record;

  return {
    ...record,
    ...buildTransformReportFilterViewPatch(record, matches, options),
  };
};
