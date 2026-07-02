import type { TransformReportFilterOptions } from './transformReportFilters';
import type { TransformReportDecodedPath, TransformReportRecord } from './transformSummary';
import type { TransformReportFilterViewMatches } from './transformReportFilterViewMatches';

export type TransformReportFilterViewPatch = Partial<TransformReportRecord>;

type NestedFieldPatchBuilder = (matchedFields: TransformReportDecodedPath[], visibleFields: TransformReportDecodedPath[], hasMore: boolean) => TransformReportFilterViewPatch;

const buildNestedFieldPatch = (
  matchedFields: TransformReportDecodedPath[],
  hasDecodedPathMatches: boolean,
  fieldLimit: number,
  buildPatch: NestedFieldPatchBuilder
): TransformReportFilterViewPatch => (
  matchedFields.length > 0
    ? buildPatch(matchedFields, matchedFields.slice(0, fieldLimit), matchedFields.length > fieldLimit)
    : hasDecodedPathMatches ? buildPatch([], [], false) : {}
);

const buildCommandFieldPatch: NestedFieldPatchBuilder = (matchedFields, visibleFields, hasMore) => ({
  nestedCommandSearchFields: matchedFields,
  nestedCommandFields: visibleFields,
  nestedCommandFieldCount: matchedFields.length,
  indexedNestedCommandFieldCount: matchedFields.length,
  hasMoreNestedCommandFields: hasMore,
});

const buildResourceFieldPatch: NestedFieldPatchBuilder = (matchedFields, visibleFields, hasMore) => ({
  nestedResourceSearchFields: matchedFields,
  nestedResourceFields: visibleFields,
  nestedResourceFieldCount: matchedFields.length,
  indexedNestedResourceFieldCount: matchedFields.length,
  hasMoreNestedResourceFields: hasMore,
});

export const buildNestedCommandFieldPatch = (
  matches: TransformReportFilterViewMatches,
  options: TransformReportFilterOptions
): TransformReportFilterViewPatch => buildNestedFieldPatch(
  matches.nestedCommandFields,
  matches.decodedPaths.length > 0,
  options.nestedCommandFieldLimit,
  buildCommandFieldPatch
);

export const buildNestedResourceFieldPatch = (
  matches: TransformReportFilterViewMatches,
  options: TransformReportFilterOptions
): TransformReportFilterViewPatch => buildNestedFieldPatch(
  matches.nestedResourceFields,
  matches.decodedPaths.length > 0,
  options.nestedCommandFieldLimit,
  buildResourceFieldPatch
);
