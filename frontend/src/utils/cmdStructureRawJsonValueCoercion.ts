import type { JsonObject, JsonValue } from '../types';
import { defineJsonProperty } from './jsonObjectProperty';

type JsonValueCoercionFrame =
  | { kind: 'array'; source: unknown[]; result: JsonValue[] }
  | { kind: 'object'; source: Record<string, unknown>; result: JsonObject };

export const toCmdStructureJsonValue = (value: unknown): JsonValue => {
  const pending: JsonValueCoercionFrame[] = [];
  const coerceValue = (item: unknown): JsonValue => {
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return item;
    if (typeof item === 'boolean') return item;
    if (item === null) return null;
    if (Array.isArray(item)) {
      const result = new Array<JsonValue>(item.length);
      pending.push({ kind: 'array', source: item, result });
      return result;
    }
    if (typeof item === 'object') {
      const result: JsonObject = {};
      pending.push({ kind: 'object', source: item as Record<string, unknown>, result });
      return result;
    }
    return String(item);
  };

  const result = coerceValue(value);
  while (pending.length > 0) {
    const frame = pending.pop();
    if (!frame) continue;

    if (frame.kind === 'array') {
      for (let index = 0; index < frame.source.length; index += 1) {
        if (index in frame.source) {
          frame.result[index] = coerceValue(frame.source[index]);
        }
      }
      continue;
    }

    for (const [key, item] of Object.entries(frame.source)) {
      defineJsonProperty(frame.result, key, coerceValue(item));
    }
  }
  return result;
};
