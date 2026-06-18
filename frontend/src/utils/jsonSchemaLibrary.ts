export interface JsonSchemaLibraryItem {
  id: string;
  name: string;
  schemaText: string;
  updatedAt: number;
}

export const MAX_JSON_SCHEMA_LIBRARY_ITEMS = 12;

const MAX_SCHEMA_NAME_LENGTH = 64;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const normalizeSchemaText = (schemaText: string): string => schemaText.trim();

const compactName = (name: string): string => {
  const normalized = name.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_SCHEMA_NAME_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_SCHEMA_NAME_LENGTH - 3)}...`;
};

const getNameFromSchemaId = (schemaId: string): string => {
  const parts = schemaId.split(/[\/#]/).filter(Boolean);
  return parts.at(-1) || schemaId;
};

const getSchemaName = (schemaText: string): string => {
  try {
    const parsed: unknown = JSON.parse(schemaText);
    if (!isRecord(parsed)) return '未命名 Schema';

    if (typeof parsed.title === 'string' && parsed.title.trim()) {
      return compactName(parsed.title);
    }

    if (typeof parsed.$id === 'string' && parsed.$id.trim()) {
      return compactName(getNameFromSchemaId(parsed.$id));
    }
  } catch {
    return '未命名 Schema';
  }

  return '未命名 Schema';
};

const hashSchemaText = (schemaText: string): string => {
  let hash = 5381;
  for (let index = 0; index < schemaText.length; index++) {
    hash = ((hash << 5) + hash) ^ schemaText.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
};

export const createJsonSchemaLibraryItem = (
  schemaText: string,
  now: number = Date.now()
): JsonSchemaLibraryItem | null => {
  const normalizedSchemaText = normalizeSchemaText(schemaText);
  if (!normalizedSchemaText) return null;

  return {
    id: `schema-${hashSchemaText(normalizedSchemaText)}`,
    name: getSchemaName(normalizedSchemaText),
    schemaText: normalizedSchemaText,
    updatedAt: now,
  };
};

const isValidLibraryItem = (value: unknown): value is JsonSchemaLibraryItem => (
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.schemaText === 'string' &&
  typeof value.updatedAt === 'number' &&
  Number.isFinite(value.updatedAt)
);

export const parseJsonSchemaLibrary = (stored: string | null): JsonSchemaLibraryItem[] => {
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isValidLibraryItem)
      .slice(0, MAX_JSON_SCHEMA_LIBRARY_ITEMS);
  } catch {
    return [];
  }
};

export const serializeJsonSchemaLibrary = (items: JsonSchemaLibraryItem[]): string => (
  JSON.stringify(items.slice(0, MAX_JSON_SCHEMA_LIBRARY_ITEMS))
);

export const upsertJsonSchemaLibraryItem = (
  items: JsonSchemaLibraryItem[],
  schemaText: string,
  now: number = Date.now()
): JsonSchemaLibraryItem[] => {
  const nextItem = createJsonSchemaLibraryItem(schemaText, now);
  if (!nextItem) return items;

  return [
    nextItem,
    ...items.filter(item => item.id !== nextItem.id),
  ].slice(0, MAX_JSON_SCHEMA_LIBRARY_ITEMS);
};

export const removeJsonSchemaLibraryItem = (
  items: JsonSchemaLibraryItem[],
  itemId: string
): JsonSchemaLibraryItem[] => (
  items.filter(item => item.id !== itemId)
);
