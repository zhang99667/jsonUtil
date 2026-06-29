import {
  getResourceTypeLabel,
  getResourceTypeQuery,
} from './staticResourceSchema';
import {
  collectCommandSchemaOccurrences,
  type CommandSchemaOccurrenceKind,
} from './transformReportCommandSchemaOccurrences';
import type {
  TransformReportCommandSchemaGroup,
  TransformReportCommandSchemaOriginGroup,
  TransformReportRecord,
  TransformReportResourceType,
  TransformReportResourceTypeGroup,
} from './transformSummary';

interface CommandSchemaGroupDraft {
  schema: string;
  count: number;
  recordPaths: Set<string>;
  paths: string[];
  hasMorePaths: boolean;
  resourceType?: TransformReportResourceType;
}

interface CommandSchemaOriginGroupDraft {
  origin: string;
  count: number;
  recordPaths: Set<string>;
  schemas: Set<string>;
  visibleSchemas: string[];
  hasMoreSchemas: boolean;
}

interface CommandSchemaGroupsOptions {
  limit?: number;
  pathLimit?: number;
  kind?: CommandSchemaOccurrenceKind;
}

const DEFAULT_TOP_COMMAND_SCHEMA_LIMIT = 8;
const DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT = 4;
const DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_SCHEMA_LIMIT = 4;

export const getCommandSchemaOrigin = (schema: string): string => {
  const trimmed = schema.trim().replace(/\\\//g, '/');
  const protocolRelativeMatch = trimmed.match(/^\/\/([^/?#\s]+)/);
  if (protocolRelativeMatch) return `//${protocolRelativeMatch[1]}`;

  const absoluteMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9+.-]*:)\/\/([^/?#\s]+)/);
  if (absoluteMatch) return `${absoluteMatch[1]}//${absoluteMatch[2]}`;

  const protocolMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9+.-]*:)/);
  return protocolMatch ? protocolMatch[1] : trimmed;
};

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

export const buildTopResourceTypeGroups = (
  records: TransformReportRecord[],
  schemaLimit = DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT
): TransformReportResourceTypeGroup[] => {
  const resourceOccurrences = collectCommandSchemaOccurrences(records).filter(occurrence => (
    occurrence.kind === 'resource' && occurrence.resourceType
  ));
  const totalCount = resourceOccurrences.length;
  if (totalCount === 0) return [];

  const groups = new Map<TransformReportResourceType, {
    resourceType: TransformReportResourceType;
    count: number;
    recordPaths: Set<string>;
    schemas: string[];
    schemaSet: Set<string>;
    hasMoreSchemas: boolean;
  }>();

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

export const buildTopCommandSchemaOriginGroups = (
  records: TransformReportRecord[],
  options: CommandSchemaGroupsOptions = {}
): TransformReportCommandSchemaOriginGroup[] => {
  const {
    limit = DEFAULT_TOP_COMMAND_SCHEMA_LIMIT,
    kind = 'navigation',
  } = options;
  const groups = new Map<string, CommandSchemaOriginGroupDraft>();

  collectCommandSchemaOccurrences(records).forEach(({ schema, recordPath, kind: occurrenceKind }) => {
    if (occurrenceKind !== kind) return;

    const origin = getCommandSchemaOrigin(schema);
    let group = groups.get(origin);
    if (!group) {
      group = {
        origin,
        count: 0,
        recordPaths: new Set(),
        schemas: new Set(),
        visibleSchemas: [],
        hasMoreSchemas: false,
      };
      groups.set(origin, group);
    }

    group.count += 1;
    group.recordPaths.add(recordPath);
    if (!group.schemas.has(schema)) {
      group.schemas.add(schema);
      if (group.visibleSchemas.length < DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_SCHEMA_LIMIT) {
        group.visibleSchemas.push(schema);
      } else {
        group.hasMoreSchemas = true;
      }
    }
  });

  return Array.from(groups.values())
    .sort((left, right) => right.count - left.count || left.origin.localeCompare(right.origin))
    .slice(0, limit)
    .map(group => ({
      origin: group.origin,
      count: group.count,
      schemaCount: group.schemas.size,
      recordCount: group.recordPaths.size,
      schemas: group.visibleSchemas,
      hasMoreSchemas: group.hasMoreSchemas,
    }));
};
