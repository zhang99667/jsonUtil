import { collectCommandSchemaOccurrences } from './transformReportCommandSchemaOccurrences';
import { DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT } from './transformReportCommandSchemaGroupOptions';
import {
  buildResourceTypeGroupDrafts,
  isResourceTypeOccurrence,
} from './transformReportResourceTypeGroupDrafts';
import { buildResourceTypeGroupResults } from './transformReportResourceTypeGroupResults';
import type { TransformReportRecord, TransformReportResourceTypeGroup } from './transformSummaryTypes';

export const buildTopResourceTypeGroups = (
  records: TransformReportRecord[],
  schemaLimit = DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT
): TransformReportResourceTypeGroup[] => {
  const resourceOccurrences = collectCommandSchemaOccurrences(records).filter(isResourceTypeOccurrence);
  const totalCount = resourceOccurrences.length;
  if (totalCount === 0) return [];

  return buildResourceTypeGroupResults(
    buildResourceTypeGroupDrafts(resourceOccurrences, schemaLimit),
    totalCount
  );
};
