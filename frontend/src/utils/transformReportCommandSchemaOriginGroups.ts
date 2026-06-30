import { collectCommandSchemaOccurrences } from './transformReportCommandSchemaOccurrences';
import {
  DEFAULT_TOP_COMMAND_SCHEMA_LIMIT,
  DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_SCHEMA_LIMIT,
  type CommandSchemaGroupsOptions,
} from './transformReportCommandSchemaGroupOptions';
import type {
  TransformReportCommandSchemaOriginGroup,
  TransformReportRecord,
} from './transformSummaryTypes';

interface CommandSchemaOriginGroupDraft {
  origin: string;
  count: number;
  recordPaths: Set<string>;
  schemas: Set<string>;
  visibleSchemas: string[];
  hasMoreSchemas: boolean;
}

export const getCommandSchemaOrigin = (schema: string): string => {
  const trimmed = schema.trim().replace(/\\\//g, '/');
  const protocolRelativeMatch = trimmed.match(/^\/\/([^/?#\s]+)/);
  if (protocolRelativeMatch) return `//${protocolRelativeMatch[1]}`;

  const absoluteMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9+.-]*:)\/\/([^/?#\s]+)/);
  if (absoluteMatch) return `${absoluteMatch[1]}//${absoluteMatch[2]}`;

  const protocolMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9+.-]*:)/);
  return protocolMatch ? protocolMatch[1] : trimmed;
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
