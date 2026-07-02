import type { TransformReportCommandSchemaOriginGroup } from './transformSummaryTypes';
import type { CommandSchemaOriginGroupDraft } from './transformReportCommandSchemaOriginGroupDrafts';

const compareCommandSchemaOriginGroupDrafts = (
  left: CommandSchemaOriginGroupDraft,
  right: CommandSchemaOriginGroupDraft
): number => (
  right.count - left.count || left.origin.localeCompare(right.origin)
);

const buildCommandSchemaOriginGroupResult = (
  group: CommandSchemaOriginGroupDraft
): TransformReportCommandSchemaOriginGroup => ({
  origin: group.origin,
  count: group.count,
  schemaCount: group.schemas.size,
  recordCount: group.recordPaths.size,
  schemas: group.visibleSchemas,
  hasMoreSchemas: group.hasMoreSchemas,
});

export const buildCommandSchemaOriginGroupResults = (
  groups: Map<string, CommandSchemaOriginGroupDraft>,
  limit: number
): TransformReportCommandSchemaOriginGroup[] => (
  Array.from(groups.values())
    .sort(compareCommandSchemaOriginGroupDrafts)
    .slice(0, limit)
    .map(buildCommandSchemaOriginGroupResult)
);
