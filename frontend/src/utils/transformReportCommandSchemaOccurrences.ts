import { getUrlResourceSchemaFromUrl } from './schemeMetadata';
import {
  getStaticResourceType,
  isStaticResourceSchema,
} from './staticResourceSchema';
import type {
  TransformReportDecodedPath,
  TransformReportRecord,
  TransformReportResourceType,
} from './transformSummary';

export type CommandSchemaOccurrenceKind = 'navigation' | 'resource';

export interface CommandSchemaOccurrence {
  schema: string;
  path: string;
  recordPath: string;
  kind: CommandSchemaOccurrenceKind;
  resourceType?: TransformReportResourceType;
}

const getResourceSchemaFromRow = (row: TransformReportDecodedPath): string | undefined => {
  const schemaSource = typeof row.sourceValue === 'string'
    ? row.sourceValue
    : typeof row.value === 'string'
      ? row.value
      : undefined;

  return schemaSource ? getUrlResourceSchemaFromUrl(schemaSource) : undefined;
};

export const collectCommandSchemaOccurrences = (
  records: TransformReportRecord[]
): CommandSchemaOccurrence[] => {
  const occurrences: CommandSchemaOccurrence[] = [];

  const pushSchema = (schema: string | undefined, path: string, recordPath: string) => {
    if (!schema) return;
    const kind = isStaticResourceSchema(schema, path) ? 'resource' : 'navigation';
    occurrences.push({
      schema,
      path,
      recordPath,
      kind,
      ...(kind === 'resource' ? { resourceType: getStaticResourceType(schema, path) } : {}),
    });
  };

  const pushResourceSchema = (row: TransformReportDecodedPath, recordPath: string) => {
    const schema = getResourceSchemaFromRow(row);
    if (!schema) return;

    occurrences.push({
      schema,
      path: row.path,
      recordPath,
      kind: 'resource',
      resourceType: getStaticResourceType(schema, row.path),
    });
  };

  records.forEach(record => {
    pushSchema(record.commandSchema, record.path, record.path);
    record.commandSchemaRows?.forEach(row => {
      pushSchema(row.schema, row.path, record.path);
    });
    record.nestedResourceSearchFields?.forEach(row => {
      pushResourceSchema(row, record.path);
    });
  });

  return occurrences;
};
