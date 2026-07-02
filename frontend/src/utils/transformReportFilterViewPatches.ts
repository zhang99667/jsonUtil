import type { TransformReportFilterOptions } from './transformReportFilters';
import { buildCmdStructureFocusPatch } from './transformReportFilterViewFocusPatch';
import type { TransformReportRecord } from './transformSummary';
import type { TransformReportFilterViewMatches } from './transformReportFilterViewMatches';

type TransformReportFilterViewPatch = Partial<TransformReportRecord>;

const buildDecodedPathPatch = (
  matches: TransformReportFilterViewMatches,
  options: TransformReportFilterOptions
): TransformReportFilterViewPatch => (
  matches.decodedPaths.length > 0
    ? {
        decodedSearchPaths: matches.decodedPaths,
        decodedPaths: matches.decodedPaths.slice(0, options.decodedPathLimit),
        decodedPathCount: matches.decodedPaths.length,
        isDecodedPathCountTruncated: false,
        indexedDecodedPathCount: matches.decodedPaths.length,
        hasMoreDecodedPaths: matches.decodedPaths.length > options.decodedPathLimit,
      }
    : {}
);

const buildNestedCommandFieldPatch = (
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

const buildNestedResourceFieldPatch = (
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

export const buildTransformReportFilterViewPatch = (
  record: TransformReportRecord,
  matches: TransformReportFilterViewMatches,
  options: TransformReportFilterOptions
): TransformReportFilterViewPatch => ({
  ...buildDecodedPathPatch(matches, options),
  ...buildNestedCommandFieldPatch(matches, options),
  ...buildNestedResourceFieldPatch(matches, options),
  ...(matches.commandSchemaRows.length > 0 ? { commandSchemaRows: matches.commandSchemaRows } : {}),
  ...buildCmdStructureFocusPatch(record, matches),
});
