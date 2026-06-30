import { getResourceTypeLabel } from './staticResourceSchema';
import {
  collectCommandSchemaOccurrences,
} from './transformReportCommandSchemaOccurrences';
import {
  DEFAULT_TOP_COMMAND_SCHEMA_LIMIT,
  DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT,
  type CommandSchemaGroupsOptions,
} from './transformReportCommandSchemaGroupOptions';
import type {
  TransformReportCommandSchemaGroup,
  TransformReportRecord,
  TransformReportResourceType,
} from './transformSummaryTypes';

export {
  buildTopCommandSchemaOriginGroups,
  getCommandSchemaOrigin,
} from './transformReportCommandSchemaOriginGroups';
export { buildTopResourceTypeGroups } from './transformReportResourceTypeGroups';

interface CommandSchemaGroupDraft {
  schema: string;
  count: number;
  recordPaths: Set<string>;
  paths: string[];
  hasMorePaths: boolean;
  resourceType?: TransformReportResourceType;
}

export const buildTopCommandSchemaGroups = (
  records: TransformReportRecord[],
  options: CommandSchemaGroupsOptions = {}
): TransformReportCommandSchemaGroup[] => {
  const {
    limit = DEFAULT_TOP_COMMAND_SCHEMA_LIMIT,
    pathLimit = DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT,
    kind = 'navigation',
  } = options;
  const groups = new Map<string, CommandSchemaGroupDraft>();

  collectCommandSchemaOccurrences(records).forEach((occurrence) => {
    if (occurrence.kind !== kind) return;

    let group = groups.get(occurrence.schema);
    if (!group) {
      group = {
        schema: occurrence.schema,
        count: 0,
        recordPaths: new Set(),
        paths: [],
        hasMorePaths: false,
        ...(occurrence.resourceType ? { resourceType: occurrence.resourceType } : {}),
      };
      groups.set(occurrence.schema, group);
    } else if (occurrence.resourceType && group.resourceType === 'other') {
      group.resourceType = occurrence.resourceType;
    }

    group.count += 1;
    group.recordPaths.add(occurrence.recordPath);
    if (group.paths.length < pathLimit) {
      group.paths.push(occurrence.path);
    } else {
      group.hasMorePaths = true;
    }
  });

  return Array.from(groups.values())
    .sort((left, right) => right.count - left.count || left.schema.localeCompare(right.schema))
    .slice(0, limit)
    .map(group => ({
      schema: group.schema,
      count: group.count,
      recordCount: group.recordPaths.size,
      paths: group.paths,
      hasMorePaths: group.hasMorePaths,
      ...(group.resourceType
        ? {
          resourceType: group.resourceType,
          resourceTypeLabel: getResourceTypeLabel(group.resourceType),
        }
        : {}),
    }));
};
