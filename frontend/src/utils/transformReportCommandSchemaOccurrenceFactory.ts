import {
  getStaticResourceType,
  isStaticResourceSchema,
} from './staticResourceSchema';
import { getTransformReportResourceSchemaFromDecodedPath } from './transformReportDecodedPathResource';
import type { TransformReportDecodedPath, TransformReportResourceType } from './transformSummaryTypes';

export type CommandSchemaOccurrenceKind = 'navigation' | 'resource';

export interface CommandSchemaOccurrence {
  schema: string;
  path: string;
  recordPath: string;
  kind: CommandSchemaOccurrenceKind;
  resourceType?: TransformReportResourceType;
}

export const createCommandSchemaOccurrence = (
  schema: string | undefined,
  path: string,
  recordPath: string
): CommandSchemaOccurrence | null => {
  if (!schema) return null;

  const kind = isStaticResourceSchema(schema, path) ? 'resource' : 'navigation';
  return {
    schema,
    path,
    recordPath,
    kind,
    ...(kind === 'resource' ? { resourceType: getStaticResourceType(schema, path) } : {}),
  };
};

export const createResourceFieldSchemaOccurrence = (
  row: TransformReportDecodedPath,
  recordPath: string
): CommandSchemaOccurrence | null => {
  const schema = getTransformReportResourceSchemaFromDecodedPath(row);
  if (!schema) return null;

  return {
    schema,
    path: row.path,
    recordPath,
    kind: 'resource',
    resourceType: getStaticResourceType(schema, row.path),
  };
};
