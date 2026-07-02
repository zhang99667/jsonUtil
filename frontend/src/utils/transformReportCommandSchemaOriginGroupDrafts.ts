import type { CommandSchemaOccurrence, CommandSchemaOccurrenceKind } from './transformReportCommandSchemaOccurrences';
import { getCommandSchemaOrigin } from './transformReportCommandSchemaOrigin';
import {
  addCommandSchemaOriginGroupSchema,
  createCommandSchemaOriginGroupDraft,
  type CommandSchemaOriginGroupDraft,
} from './transformReportCommandSchemaOriginGroupDraftState';

export type { CommandSchemaOriginGroupDraft } from './transformReportCommandSchemaOriginGroupDraftState';

export const buildCommandSchemaOriginGroupDrafts = (
  occurrences: CommandSchemaOccurrence[],
  kind: CommandSchemaOccurrenceKind,
  schemaLimit: number
): Map<string, CommandSchemaOriginGroupDraft> => {
  const groups = new Map<string, CommandSchemaOriginGroupDraft>();

  occurrences.forEach(({ schema, recordPath, kind: occurrenceKind }) => {
    if (occurrenceKind !== kind) return;

    const origin = getCommandSchemaOrigin(schema);
    let group = groups.get(origin);
    if (!group) {
      group = createCommandSchemaOriginGroupDraft(origin);
      groups.set(origin, group);
    }

    group.count += 1;
    group.recordPaths.add(recordPath);
    addCommandSchemaOriginGroupSchema(group, schema, schemaLimit);
  });

  return groups;
};
