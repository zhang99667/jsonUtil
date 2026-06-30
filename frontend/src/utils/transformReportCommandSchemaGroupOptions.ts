import type { CommandSchemaOccurrenceKind } from './transformReportCommandSchemaOccurrences';

export interface CommandSchemaGroupsOptions {
  limit?: number;
  pathLimit?: number;
  kind?: CommandSchemaOccurrenceKind;
}

export const DEFAULT_TOP_COMMAND_SCHEMA_LIMIT = 8;
export const DEFAULT_TOP_COMMAND_SCHEMA_PATH_LIMIT = 4;
export const DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_SCHEMA_LIMIT = 4;
