import { isRecord, parseJsonWithFallback } from './storage';

export interface JsonSchemaLibraryItem {
  id: string;
  name: string;
  schemaText: string;
  updatedAt: number;
}

interface JsonSchemaLibraryExportItem {
  name: string;
  schemaText: string;
}

interface JsonSchemaLibraryExportPackage {
  schemaVersion: 1;
  source: typeof JSON_SCHEMA_LIBRARY_EXPORT_SOURCE;
  exportedAt: string;
  itemCount: number;
  items: JsonSchemaLibraryExportItem[];
}

export interface JsonSchemaLibraryImportResult {
  items: JsonSchemaLibraryItem[];
  importedCount: number;
  skippedCount: number;
  invalidCount: number;
}

export const MAX_JSON_SCHEMA_LIBRARY_ITEMS = 12;
export const JSON_SCHEMA_LIBRARY_EXPORT_SOURCE = 'JSON_SCHEMA_LIBRARY_EXPORT';
export const JSON_SCHEMA_LIBRARY_STORAGE_KEY = 'json-schema-panel-library';

const MAX_SCHEMA_NAME_LENGTH = 64;

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

const toExportItem = (item: JsonSchemaLibraryItem): JsonSchemaLibraryExportItem => ({
  name: item.name,
  schemaText: item.schemaText,
});

export const formatJsonSchemaLibraryExport = (
  items: JsonSchemaLibraryItem[],
  now: Date = new Date()
): string => {
  const exportItems = items.slice(0, MAX_JSON_SCHEMA_LIBRARY_ITEMS).map(toExportItem);
  const exportPackage: JsonSchemaLibraryExportPackage = {
    schemaVersion: 1,
    source: JSON_SCHEMA_LIBRARY_EXPORT_SOURCE,
    exportedAt: now.toISOString(),
    itemCount: exportItems.length,
    items: exportItems,
  };

  return JSON.stringify(exportPackage, null, 2);
};

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

const looksLikeJsonSchemaObject = (value: Record<string, unknown>): boolean => (
  ['$schema', '$id', 'title', 'type', 'properties', 'items', 'required', 'oneOf', 'anyOf', 'allOf']
    .some(key => key in value)
);

type ImportableJsonSchemaValue = boolean | Record<string, unknown>;

const isImportableJsonSchemaValue = (value: unknown): value is ImportableJsonSchemaValue => (
  typeof value === 'boolean' || (isRecord(value) && looksLikeJsonSchemaObject(value))
);

const createImportableJsonSchemaLibraryItem = (
  schemaText: string,
  now: number
): JsonSchemaLibraryItem | null => {
  const normalizedSchemaText = normalizeSchemaText(schemaText);
  if (!normalizedSchemaText) return null;

  const parsed = parseJsonWithFallback<ImportableJsonSchemaValue | null>(
    normalizedSchemaText,
    null,
    isImportableJsonSchemaValue
  );
  if (parsed === null) return null;

  return createJsonSchemaLibraryItem(normalizedSchemaText, now);
};

const stringifySchemaObject = (value: unknown): string | null => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
};

const collectImportSchemaTexts = (value: unknown): string[] => {
  if (typeof value === 'boolean') {
    return [JSON.stringify(value)];
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectImportSchemaTexts);
  }

  if (!isRecord(value)) return [];

  if (value.source === JSON_SCHEMA_LIBRARY_EXPORT_SOURCE && Array.isArray(value.items)) {
    return value.items.flatMap(collectImportSchemaTexts);
  }

  if (typeof value.schemaText === 'string') {
    return collectImportSchemaTexts(value.schemaText);
  }

  if ('schema' in value) {
    return collectImportSchemaTexts(value.schema);
  }

  if (looksLikeJsonSchemaObject(value)) {
    const schemaText = stringifySchemaObject(value);
    return schemaText ? [schemaText] : [];
  }

  return [];
};

export const importJsonSchemaLibrary = (
  currentItems: JsonSchemaLibraryItem[],
  importText: string,
  now: number = Date.now()
): JsonSchemaLibraryImportResult | null => {
  const parsed = parseJsonWithFallback<unknown>(importText, null);
  const schemaTexts = collectImportSchemaTexts(parsed);
  if (schemaTexts.length === 0) return null;

  const importedItems: JsonSchemaLibraryItem[] = [];
  const importedIds = new Set<string>();
  let skippedCount = 0;
  let invalidCount = 0;

  schemaTexts.forEach((schemaText, index) => {
    const item = createImportableJsonSchemaLibraryItem(schemaText, now + index);
    if (!item) {
      invalidCount += 1;
      return;
    }

    if (importedIds.has(item.id)) {
      skippedCount += 1;
      return;
    }

    importedIds.add(item.id);
    importedItems.push(item);
  });

  if (importedItems.length === 0 && invalidCount === 0) return null;

  const nextItems = [
    ...importedItems,
    ...currentItems.filter(item => !importedIds.has(item.id)),
  ].slice(0, MAX_JSON_SCHEMA_LIBRARY_ITEMS);

  return {
    items: nextItems,
    importedCount: importedItems.length,
    skippedCount,
    invalidCount,
  };
};
