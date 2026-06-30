import type { CommandSchemaOccurrence } from './transformReportCommandSchemaOccurrences';
import type { TransformReportResourceType } from './transformSummaryTypes';

export type TransformReportResourceTypeOccurrence = CommandSchemaOccurrence & {
  kind: 'resource';
  resourceType: TransformReportResourceType;
};

export interface TransformReportResourceTypeGroupDraft {
  resourceType: TransformReportResourceType;
  count: number;
  recordPaths: Set<string>;
  schemas: string[];
  schemaSet: Set<string>;
  hasMoreSchemas: boolean;
}

export const isResourceTypeOccurrence = (occurrence: CommandSchemaOccurrence): occurrence is TransformReportResourceTypeOccurrence => (
  occurrence.kind === 'resource' && typeof occurrence.resourceType === 'string'
);

const createResourceTypeGroupDraft = (resourceType: TransformReportResourceType): TransformReportResourceTypeGroupDraft => ({
  resourceType,
  count: 0,
  recordPaths: new Set(),
  schemas: [],
  schemaSet: new Set(),
  hasMoreSchemas: false,
});

const addResourceTypeGroupSchema = (
  group: TransformReportResourceTypeGroupDraft,
  schema: string,
  schemaLimit: number
): void => {
  group.schemaSet.add(schema);
  if (group.schemas.includes(schema)) return;
  if (group.schemas.length < schemaLimit) {
    group.schemas.push(schema);
  } else {
    group.hasMoreSchemas = true;
  }
};

export const buildResourceTypeGroupDrafts = (
  occurrences: TransformReportResourceTypeOccurrence[],
  schemaLimit: number
): Map<TransformReportResourceType, TransformReportResourceTypeGroupDraft> => {
  const groups = new Map<TransformReportResourceType, TransformReportResourceTypeGroupDraft>();

  occurrences.forEach(({ schema, recordPath, resourceType }) => {
    const group = groups.get(resourceType) ?? createResourceTypeGroupDraft(resourceType);
    groups.set(resourceType, group);
    group.count += 1;
    group.recordPaths.add(recordPath);
    addResourceTypeGroupSchema(group, schema, schemaLimit);
  });

  return groups;
};
