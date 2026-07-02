import type { TransformReportFilterOptions } from './transformReportFilters';
import { buildCmdStructureFocusPatch } from './transformReportFilterViewFocusPatch';
import {
  buildNestedCommandFieldPatch,
  buildNestedResourceFieldPatch,
  type TransformReportFilterViewPatch,
} from './transformReportFilterViewNestedPatches';
import type { TransformReportRecord } from './transformSummary';
import type { TransformReportFilterViewMatches } from './transformReportFilterViewMatches';

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
