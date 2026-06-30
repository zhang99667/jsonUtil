import {
  getResourceTypeLabel,
  getResourceTypeQuery,
} from './staticResourceSchema';
import type {
  TransformReportResourceType,
  TransformReportResourceTypeGroup,
} from './transformSummaryTypes';
import type { TransformReportResourceTypeGroupDraft } from './transformReportResourceTypeGroupDrafts';

const compareResourceTypeGroupDrafts = (
  left: TransformReportResourceTypeGroupDraft,
  right: TransformReportResourceTypeGroupDraft
): number => (
  right.count - left.count ||
  getResourceTypeLabel(left.resourceType).localeCompare(getResourceTypeLabel(right.resourceType))
);

const buildResourceTypeGroupResult = (
  group: TransformReportResourceTypeGroupDraft,
  totalCount: number
): TransformReportResourceTypeGroup => ({
  resourceType: group.resourceType,
  resourceTypeLabel: getResourceTypeLabel(group.resourceType),
  query: getResourceTypeQuery(group.resourceType),
  count: group.count,
  percentage: Number(((group.count / totalCount) * 100).toFixed(1)),
  recordCount: group.recordPaths.size,
  schemaCount: group.schemaSet.size,
  schemas: group.schemas,
  hasMoreSchemas: group.hasMoreSchemas,
});

export const buildResourceTypeGroupResults = (
  groups: Map<TransformReportResourceType, TransformReportResourceTypeGroupDraft>,
  totalCount: number
): TransformReportResourceTypeGroup[] => (
  Array.from(groups.values())
    .sort(compareResourceTypeGroupDrafts)
    .map(group => buildResourceTypeGroupResult(group, totalCount))
);
