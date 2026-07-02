import type { JsonValue } from '../types';

interface JsonObject {
  [key: string]: JsonValue;
}

export const toCmdStructureJsonValue = (value: unknown): JsonValue => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (value === null) return null;

  if (Array.isArray(value)) return value.map(toCmdStructureJsonValue);

  if (Boolean(value) && typeof value === 'object') {
    const result: JsonObject = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      result[key] = toCmdStructureJsonValue(item);
    });
    return result;
  }

  return String(value);
};
