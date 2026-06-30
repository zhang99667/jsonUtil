import type { JsonValue, PathTransformRecord } from '../types';
import {
  collectSchemeInsightFields,
  formatSchemeInsightItems,
  getSchemeInsightFieldCopyText,
  type SchemeInsightFieldRow,
} from './schemeMetadata';
import { getTransformRecordCommandSchema } from './transformReportCmdStructureSource';
import { withTransformReportDecodedPathResourceType } from './transformReportDecodedPathResource';
import { getTransformDecodedValue } from './transformReportDecodedValue';
import { joinTransformJsonPath } from './transformReportJsonPath';
import type {
  TransformReportDecodedPath,
  TransformReportRecord,
} from './transformSummary';

export type TransformReportRecordInsightData = Pick<
  TransformReportRecord,
  | 'insights'
  | 'nestedCommandFields'
  | 'nestedCommandSearchFields'
  | 'indexedNestedCommandFieldCount'
  | 'hasMoreNestedCommandFields'
  | 'nestedResourceFields'
  | 'nestedResourceSearchFields'
  | 'indexedNestedResourceFieldCount'
  | 'hasMoreNestedResourceFields'
  | 'nestedCommandFieldCount'
  | 'nestedResourceFieldCount'
  | 'nestedExtFieldCount'
  | 'nestedBase64SuffixFieldCount'
>;

export const DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT = 8;
const DEFAULT_NESTED_COMMAND_FIELD_SEARCH_LIMIT = 200;

const buildNestedInsightSearchFields = (
  recordPath: string,
  rows: SchemeInsightFieldRow[]
): TransformReportDecodedPath[] => rows
  .slice(0, DEFAULT_NESTED_COMMAND_FIELD_SEARCH_LIMIT)
  .map(row => {
    const path = joinTransformJsonPath(recordPath, row.path);
    if (Object.prototype.hasOwnProperty.call(row, 'value')) {
      return {
        path,
        preview: row.preview,
        value: row.value as JsonValue,
        ...(row.sourceValue !== undefined ? { sourceValue: row.sourceValue as JsonValue } : {}),
      };
    }

    return {
      path,
      preview: row.preview,
      copyText: getSchemeInsightFieldCopyText(row).replace(row.path, path),
    };
  });

export const buildTransformRecordInsightData = (
  record: PathTransformRecord
): TransformReportRecordInsightData => {
  const insights: string[] = [];
  const commandSchema = getTransformRecordCommandSchema(record);
  if (commandSchema) {
    insights.push(`cmdSchema: ${commandSchema}`);
  }

  const decodedValue = getTransformDecodedValue(record);
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return {
      insights,
      nestedCommandFields: [],
      indexedNestedCommandFieldCount: 0,
      hasMoreNestedCommandFields: false,
      nestedResourceFields: [],
      indexedNestedResourceFieldCount: 0,
      hasMoreNestedResourceFields: false,
      nestedCommandFieldCount: 0,
      nestedResourceFieldCount: 0,
      nestedExtFieldCount: 0,
      nestedBase64SuffixFieldCount: 0,
    };
  }

  const {
    commandFields,
    commandFieldRows,
    commandFieldCount,
    resourceFields,
    resourceFieldRows,
    resourceFieldCount,
    extFields,
    extFieldCount,
    base64SuffixFields,
    base64SuffixFieldCount,
  } = collectSchemeInsightFields(decodedValue, { source: record.originalValue });
  const nestedCommandSearchFields = buildNestedInsightSearchFields(record.path, commandFieldRows);
  const nestedResourceSearchFields = buildNestedInsightSearchFields(record.path, resourceFieldRows)
    .map(withTransformReportDecodedPathResourceType);

  const nestedCmdInsight = formatSchemeInsightItems('cmd解析', commandFields);
  const resourceInsight = formatSchemeInsightItems('资源URL', resourceFields);
  const extInsight = formatSchemeInsightItems('ext解析', extFields);
  const suffixInsight = formatSchemeInsightItems('Base64 后缀', base64SuffixFields, 6);

  return {
    insights: [
      ...insights,
      ...(nestedCmdInsight ? [nestedCmdInsight] : []),
      ...(resourceInsight ? [resourceInsight] : []),
      ...(extInsight ? [extInsight] : []),
      ...(suffixInsight ? [suffixInsight] : []),
    ],
    nestedCommandFields: nestedCommandSearchFields.slice(0, DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT),
    ...(nestedCommandSearchFields.length > 0 ? { nestedCommandSearchFields } : {}),
    indexedNestedCommandFieldCount: nestedCommandSearchFields.length,
    hasMoreNestedCommandFields: commandFieldCount > DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT,
    nestedResourceFields: nestedResourceSearchFields.slice(0, DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT),
    ...(nestedResourceSearchFields.length > 0 ? { nestedResourceSearchFields } : {}),
    indexedNestedResourceFieldCount: nestedResourceSearchFields.length,
    hasMoreNestedResourceFields: resourceFieldCount > DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT,
    nestedCommandFieldCount: commandFieldCount,
    nestedResourceFieldCount: resourceFieldCount,
    nestedExtFieldCount: extFieldCount,
    nestedBase64SuffixFieldCount: base64SuffixFieldCount,
  };
};
