import type { TransformReportResourceType } from './transformSummaryTypes';

export interface TransformReportResourceTypeGroupDraft {
  resourceType: TransformReportResourceType;
  count: number;
  recordPaths: Set<string>;
  schemas: string[];
  schemaSet: Set<string>;
  hasMoreSchemas: boolean;
}

export const createResourceTypeGroupDraft = (
  resourceType: TransformReportResourceType
): TransformReportResourceTypeGroupDraft => ({
  resourceType,
  count: 0,
  recordPaths: new Set(),
  schemas: [],
  schemaSet: new Set(),
  hasMoreSchemas: false,
});

export const addResourceTypeGroupSchema = (
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
