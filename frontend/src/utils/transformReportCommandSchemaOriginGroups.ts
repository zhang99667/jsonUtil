import { collectCommandSchemaOccurrences } from './transformReportCommandSchemaOccurrences';
import {
  DEFAULT_TOP_COMMAND_SCHEMA_LIMIT,
  DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_SCHEMA_LIMIT,
  type CommandSchemaGroupsOptions,
} from './transformReportCommandSchemaGroupOptions';
import {
  buildCommandSchemaOriginGroupDrafts,
} from './transformReportCommandSchemaOriginGroupDrafts';
import { buildCommandSchemaOriginGroupResults } from './transformReportCommandSchemaOriginGroupResults';
import type {
  TransformReportCommandSchemaOriginGroup,
  TransformReportRecord,
} from './transformSummaryTypes';

export { getCommandSchemaOrigin } from './transformReportCommandSchemaOrigin';

export const buildTopCommandSchemaOriginGroups = (
  records: TransformReportRecord[],
  options: CommandSchemaGroupsOptions = {}
): TransformReportCommandSchemaOriginGroup[] => {
  const {
    limit = DEFAULT_TOP_COMMAND_SCHEMA_LIMIT,
    kind = 'navigation',
  } = options;

  return buildCommandSchemaOriginGroupResults(
    buildCommandSchemaOriginGroupDrafts(
      collectCommandSchemaOccurrences(records),
      kind,
      DEFAULT_TOP_COMMAND_SCHEMA_ORIGIN_SCHEMA_LIMIT
    ),
    limit
  );
};
