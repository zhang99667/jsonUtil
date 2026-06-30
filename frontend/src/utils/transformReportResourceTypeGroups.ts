import {
  getResourceTypeLabel,
  getResourceTypeQuery,
} from './staticResourceSchema';
import { collectCommandSchemaOccurrences } from './transformReportCommandSchemaOccurrences';
import { DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT } from './transformReportCommandSchemaGroupOptions';
import type {
  TransformReportRecord,
  TransformReportResourceType,
  TransformReportResourceTypeGroup,
} from './transformSummaryTypes';

interface ResourceTypeGroupDraft {
  resourceType: TransformReportResourceType;
  count: number;
  recordPaths: Set<string>;
  schemas: string[];
  schemaSet: Set<string>;
  hasMoreSchemas: boolean;
}

export const buildTopResourceTypeGroups = (
  records: TransformReportRecord[],
  schemaLimit = DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT
): TransformReportResourceTypeGroup[] => {
  const resourceOccurrences = collectCommandSchemaOccurrences(records).filter(occurrence => (
    occurrence.kind === 'resource' && occurrence.resourceType
  ));
  const totalCount = resourceOccurrences.length;
  if (totalCount === 0) return [];

  const groups = new Map<TransformReportResourceType, ResourceTypeGroupDraft>();

  resourceOccurrences.forEach(({ schema, recordPath, resourceType }) => {
    if (!resourceType) return;

    let group = groups.get(resourceType);
    if (!group) {
      group = {
        resourceType,
        count: 0,
        recordPaths: new Set(),
        schemas: [],
        schemaSet: new Set(),
        hasMoreSchemas: false,
      };
      groups.set(resourceType, group);
    }

    group.count += 1;
    group.recordPaths.add(recordPath);
    group.schemaSet.add(schema);
    if (group.schemas.includes(schema)) return;
    if (group.schemas.length < schemaLimit) {
      group.schemas.push(schema);
    } else {
      group.hasMoreSchemas = true;
    }
  });

  return Array.from(groups.values())
    .sort((left, right) => (
      right.count - left.count ||
      getResourceTypeLabel(left.resourceType).localeCompare(getResourceTypeLabel(right.resourceType))
    ))
    .map(group => ({
      resourceType: group.resourceType,
      resourceTypeLabel: getResourceTypeLabel(group.resourceType),
      query: getResourceTypeQuery(group.resourceType),
      count: group.count,
      percentage: Number(((group.count / totalCount) * 100).toFixed(1)),
      recordCount: group.recordPaths.size,
      schemaCount: group.schemaSet.size,
      schemas: group.schemas,
      hasMoreSchemas: group.hasMoreSchemas,
    }));
};
