import type { TransformReportFilterOptions } from './transformReportFilters';
import type { TransformReportRecord } from './transformSummary';
import type { TransformReportFilterViewMatches } from './transformReportFilterViewMatches';

export type TransformReportFilterViewPatch = Partial<TransformReportRecord>;

export const buildNestedCommandFieldPatch = (
  matches: TransformReportFilterViewMatches,
  options: TransformReportFilterOptions
): TransformReportFilterViewPatch => {
  if (matches.nestedCommandFields.length > 0) {
    return {
      nestedCommandSearchFields: matches.nestedCommandFields,
      nestedCommandFields: matches.nestedCommandFields.slice(0, options.nestedCommandFieldLimit),
      nestedCommandFieldCount: matches.nestedCommandFields.length,
      indexedNestedCommandFieldCount: matches.nestedCommandFields.length,
      hasMoreNestedCommandFields: matches.nestedCommandFields.length > options.nestedCommandFieldLimit,
    };
  }

  return matches.decodedPaths.length > 0
    ? {
        nestedCommandSearchFields: [],
        nestedCommandFields: [],
        nestedCommandFieldCount: 0,
        indexedNestedCommandFieldCount: 0,
        hasMoreNestedCommandFields: false,
      }
    : {};
};

export const buildNestedResourceFieldPatch = (
  matches: TransformReportFilterViewMatches,
  options: TransformReportFilterOptions
): TransformReportFilterViewPatch => {
  if (matches.nestedResourceFields.length > 0) {
    return {
      nestedResourceSearchFields: matches.nestedResourceFields,
      nestedResourceFields: matches.nestedResourceFields.slice(0, options.nestedCommandFieldLimit),
      nestedResourceFieldCount: matches.nestedResourceFields.length,
      indexedNestedResourceFieldCount: matches.nestedResourceFields.length,
      hasMoreNestedResourceFields: matches.nestedResourceFields.length > options.nestedCommandFieldLimit,
    };
  }

  return matches.decodedPaths.length > 0
    ? {
        nestedResourceSearchFields: [],
        nestedResourceFields: [],
        nestedResourceFieldCount: 0,
        indexedNestedResourceFieldCount: 0,
        hasMoreNestedResourceFields: false,
      }
    : {};
};
