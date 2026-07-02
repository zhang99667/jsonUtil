export interface CommandSchemaOriginGroupDraft {
  origin: string;
  count: number;
  recordPaths: Set<string>;
  schemas: Set<string>;
  visibleSchemas: string[];
  hasMoreSchemas: boolean;
}

export const createCommandSchemaOriginGroupDraft = (origin: string): CommandSchemaOriginGroupDraft => ({
  origin,
  count: 0,
  recordPaths: new Set(),
  schemas: new Set(),
  visibleSchemas: [],
  hasMoreSchemas: false,
});

export const addCommandSchemaOriginGroupSchema = (
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
