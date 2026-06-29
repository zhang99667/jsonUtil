import type { TransformReportRecord } from './transformSummary';
import {
  CMD_STRUCTURE_SEARCH_TEXT,
  NESTED_CMD_SEARCH_TEXT,
  NESTED_RESOURCE_SEARCH_TEXT,
  includesQuery,
  matchesCommandSchemaRow,
  matchesDecodedPath,
  matchesNestedCommandField,
} from './transformReportFilterMatchers';

export { buildFilteredRecordView } from './transformReportFilterView';
export {
  includesQuery,
  isIssuePriorityQuery,
  matchesCommandSchemaRow,
  matchesDecodedPath,
  matchesNestedCommandField,
  matchesResourceType,
  shouldSearchLongSourceValue,
} from './transformReportFilterMatchers';

export interface TransformReportFilterOptions {
  decodedPathLimit: number;
  nestedCommandFieldLimit: number;
  getCommandSchemaOrigin: (schema: string) => string;
  getSchemeParamStageSearchText: (summary: TransformReportRecord['schemeParamStageSummary']) => string;
}

export const matchesReportRecord = (
  record: TransformReportRecord,
  normalizedQuery: string,
  options: TransformReportFilterOptions
): boolean => (
  !normalizedQuery ||
  includesQuery(record.path, normalizedQuery) ||
  (record.sourceLabel ? includesQuery(record.sourceLabel, normalizedQuery) : false) ||
  (record.commandSchema ? includesQuery(record.commandSchema, normalizedQuery) : false) ||
  (record.commandSchema ? includesQuery(options.getCommandSchemaOrigin(record.commandSchema), normalizedQuery) : false) ||
  includesQuery(record.labels.join(' '), normalizedQuery) ||
  includesQuery(record.insights.join(' '), normalizedQuery) ||
  includesQuery(options.getSchemeParamStageSearchText(record.schemeParamStageSummary), normalizedQuery) ||
  (record.hasCmdStructure ? includesQuery(CMD_STRUCTURE_SEARCH_TEXT, normalizedQuery) : false) ||
  (record.nestedCommandFieldCount > 0 ? includesQuery(NESTED_CMD_SEARCH_TEXT, normalizedQuery) : false) ||
  ((record.nestedResourceFieldCount || 0) > 0 ? includesQuery(NESTED_RESOURCE_SEARCH_TEXT, normalizedQuery) : false) ||
  (record.nestedCommandSearchFields
    ? record.nestedCommandSearchFields.some(row => matchesNestedCommandField(row, normalizedQuery))
    : false) ||
  (record.nestedResourceSearchFields
    ? record.nestedResourceSearchFields.some(row => matchesNestedCommandField(row, normalizedQuery))
    : false) ||
  (record.commandSchemaRows
    ? record.commandSchemaRows.some(row => matchesCommandSchemaRow(row, normalizedQuery, options.getCommandSchemaOrigin))
    : false) ||
  includesQuery(record.originalPreview, normalizedQuery) ||
  (record.decodedPreview ? includesQuery(record.decodedPreview, normalizedQuery) : false) ||
  (record.decodedSearchText ? includesQuery(record.decodedSearchText, normalizedQuery) : false) ||
  (record.decodedSearchPaths ? record.decodedSearchPaths.some(row => matchesDecodedPath(row, normalizedQuery)) : false) ||
  record.decodedPaths.some(row => (
    includesQuery(row.path, normalizedQuery) ||
    includesQuery(row.preview, normalizedQuery)
  ))
);
