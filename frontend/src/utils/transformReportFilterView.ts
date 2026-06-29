import {
  matchesCommandSchemaRow,
  matchesDecodedPath,
  matchesNestedCommandField,
} from './transformReportFilterMatchers';
import type { TransformReportFilterOptions } from './transformReportFilters';
import type { TransformReportRecord } from './transformSummary';

export const buildFilteredRecordView = (
  record: TransformReportRecord,
  normalizedQuery: string,
  options: TransformReportFilterOptions
): TransformReportRecord => {
  if (!normalizedQuery) return record;

  const matchedDecodedPaths = record.decodedSearchPaths?.filter(row => (
    matchesDecodedPath(row, normalizedQuery)
  )) || [];
  const matchedNestedCommandFields = record.nestedCommandSearchFields?.filter(row => (
    matchesNestedCommandField(row, normalizedQuery)
  )) || [];
  const matchedNestedResourceFields = record.nestedResourceSearchFields?.filter(row => (
    matchesNestedCommandField(row, normalizedQuery)
  )) || [];
  const matchedCommandSchemaRows = record.commandSchemaRows?.filter(row => (
    matchesCommandSchemaRow(row, normalizedQuery, options.getCommandSchemaOrigin)
  )) || [];
  if (
    matchedDecodedPaths.length === 0 &&
    matchedNestedCommandFields.length === 0 &&
    matchedNestedResourceFields.length === 0 &&
    matchedCommandSchemaRows.length === 0
  ) {
    return record;
  }

  const cmdStructureFocusRows = matchedNestedCommandFields.length > 0
    ? matchedNestedCommandFields
    : matchedCommandSchemaRows.length > 0
      ? matchedCommandSchemaRows
      : matchedDecodedPaths;
  const cmdStructureFocusLabel = matchedNestedCommandFields.length > 0
    ? '内部 CMD 字段'
    : matchedCommandSchemaRows.length > 0
      ? 'CMD Schema'
      : '内部路径';

  return {
    ...record,
    ...(matchedDecodedPaths.length > 0
      ? {
          decodedSearchPaths: matchedDecodedPaths,
          decodedPaths: matchedDecodedPaths.slice(0, options.decodedPathLimit),
          decodedPathCount: matchedDecodedPaths.length,
          isDecodedPathCountTruncated: false,
          indexedDecodedPathCount: matchedDecodedPaths.length,
          hasMoreDecodedPaths: matchedDecodedPaths.length > options.decodedPathLimit,
        }
      : {}),
    ...(matchedNestedCommandFields.length > 0
      ? {
          nestedCommandSearchFields: matchedNestedCommandFields,
          nestedCommandFields: matchedNestedCommandFields.slice(0, options.nestedCommandFieldLimit),
          nestedCommandFieldCount: matchedNestedCommandFields.length,
          indexedNestedCommandFieldCount: matchedNestedCommandFields.length,
          hasMoreNestedCommandFields: matchedNestedCommandFields.length > options.nestedCommandFieldLimit,
        }
      : matchedDecodedPaths.length > 0
        ? {
            nestedCommandSearchFields: [],
            nestedCommandFields: [],
            nestedCommandFieldCount: 0,
            indexedNestedCommandFieldCount: 0,
            hasMoreNestedCommandFields: false,
          }
        : {}),
    ...(matchedNestedResourceFields.length > 0
      ? {
          nestedResourceSearchFields: matchedNestedResourceFields,
          nestedResourceFields: matchedNestedResourceFields.slice(0, options.nestedCommandFieldLimit),
          nestedResourceFieldCount: matchedNestedResourceFields.length,
          indexedNestedResourceFieldCount: matchedNestedResourceFields.length,
          hasMoreNestedResourceFields: matchedNestedResourceFields.length > options.nestedCommandFieldLimit,
        }
      : matchedDecodedPaths.length > 0
        ? {
            nestedResourceSearchFields: [],
            nestedResourceFields: [],
            nestedResourceFieldCount: 0,
            indexedNestedResourceFieldCount: 0,
            hasMoreNestedResourceFields: false,
          }
        : {}),
    ...(matchedCommandSchemaRows.length > 0
      ? { commandSchemaRows: matchedCommandSchemaRows }
      : {}),
    ...(record.hasCmdStructure && cmdStructureFocusRows.length > 0
      ? {
          cmdStructureFocusPaths: cmdStructureFocusRows.map(row => row.path),
          cmdStructureFocusCount: cmdStructureFocusRows.length,
          cmdStructureFocusLabel,
        }
      : {}),
  };
};
