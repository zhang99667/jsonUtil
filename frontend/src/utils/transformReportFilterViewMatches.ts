import {
  matchesCommandSchemaRow,
  matchesDecodedPath,
  matchesNestedCommandField,
} from './transformReportFilterMatchers';
import type { TransformReportFilterOptions } from './transformReportFilters';
import type {
  TransformReportCommandSchemaRow,
  TransformReportDecodedPath,
  TransformReportRecord,
} from './transformSummary';

export interface TransformReportFilterViewMatches {
  decodedPaths: TransformReportDecodedPath[];
  nestedCommandFields: TransformReportDecodedPath[];
  nestedResourceFields: TransformReportDecodedPath[];
  commandSchemaRows: TransformReportCommandSchemaRow[];
}

export const collectTransformReportFilterViewMatches = (
  record: TransformReportRecord,
  normalizedQuery: string,
  options: TransformReportFilterOptions
): TransformReportFilterViewMatches => ({
  decodedPaths: record.decodedSearchPaths?.filter(row => (
    matchesDecodedPath(row, normalizedQuery)
  )) || [],
  nestedCommandFields: record.nestedCommandSearchFields?.filter(row => (
    matchesNestedCommandField(row, normalizedQuery)
  )) || [],
  nestedResourceFields: record.nestedResourceSearchFields?.filter(row => (
    matchesNestedCommandField(row, normalizedQuery)
  )) || [],
  commandSchemaRows: record.commandSchemaRows?.filter(row => (
    matchesCommandSchemaRow(row, normalizedQuery, options.getCommandSchemaOrigin)
  )) || [],
});

export const hasTransformReportFilterViewMatches = (
  matches: TransformReportFilterViewMatches
): boolean => (
  matches.decodedPaths.length > 0 ||
  matches.nestedCommandFields.length > 0 ||
  matches.nestedResourceFields.length > 0 ||
  matches.commandSchemaRows.length > 0
);
