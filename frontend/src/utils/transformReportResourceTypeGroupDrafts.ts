import type { CommandSchemaOccurrence } from './transformReportCommandSchemaOccurrences';
import {
  addResourceTypeGroupSchema,
  createResourceTypeGroupDraft,
  type TransformReportResourceTypeGroupDraft,
} from './transformReportResourceTypeGroupDraftState';
import type { TransformReportResourceType } from './transformSummaryTypes';

export type TransformReportResourceTypeOccurrence = CommandSchemaOccurrence & {
  kind: 'resource';
  resourceType: TransformReportResourceType;
};

export type { TransformReportResourceTypeGroupDraft } from './transformReportResourceTypeGroupDraftState';

export const isResourceTypeOccurrence = (occurrence: CommandSchemaOccurrence): occurrence is TransformReportResourceTypeOccurrence => (
  occurrence.kind === 'resource' && typeof occurrence.resourceType === 'string'
);

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
