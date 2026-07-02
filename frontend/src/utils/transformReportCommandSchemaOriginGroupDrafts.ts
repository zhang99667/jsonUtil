import type { CommandSchemaOccurrence, CommandSchemaOccurrenceKind } from './transformReportCommandSchemaOccurrences';
import { getCommandSchemaOrigin } from './transformReportCommandSchemaOrigin';

export interface CommandSchemaOriginGroupDraft {
  origin: string;
  count: number;
  recordPaths: Set<string>;
  schemas: Set<string>;
  visibleSchemas: string[];
  hasMoreSchemas: boolean;
}

const createCommandSchemaOriginGroupDraft = (origin: string): CommandSchemaOriginGroupDraft => ({
  origin,
  count: 0,
  recordPaths: new Set(),
  schemas: new Set(),
  visibleSchemas: [],
  hasMoreSchemas: false,
});

const addCommandSchemaOriginGroupSchema = (
  group: CommandSchemaOriginGroupDraft,
  schema: string,
  schemaLimit: number
): void => {
  if (group.schemas.has(schema)) return;
  group.schemas.add(schema);
  if (group.visibleSchemas.length < schemaLimit) {
    group.visibleSchemas.push(schema);
  } else {
    group.hasMoreSchemas = true;
  }
};

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
