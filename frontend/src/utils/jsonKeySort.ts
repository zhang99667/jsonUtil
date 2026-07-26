import type { JsonObject, JsonValue } from '../types.ts';
import { defineJsonProperty } from './jsonObjectProperty.ts';
import { isJsonObject } from './jsonValueGuards.ts';

type SortFrame =
  | { kind: 'array'; source: JsonValue[]; result: JsonValue[] }
  | { kind: 'object'; source: JsonObject; result: JsonObject };

export const sortJsonKeys = (value: JsonValue): JsonValue => {
  const pending: SortFrame[] = [];
  const cloneValue = (item: JsonValue): JsonValue => {
    if (Array.isArray(item)) {
      const result = new Array<JsonValue>(item.length);
      pending.push({ kind: 'array', source: item, result });
      return result;
    }
    if (isJsonObject(item)) {
      const result: JsonObject = {};
      pending.push({ kind: 'object', source: item, result });
      return result;
    }
    return item;
  };

  const result = cloneValue(value);
  while (pending.length > 0) {
    const frame = pending.pop();
    if (!frame) continue;

    if (frame.kind === 'array') {
      for (let index = 0; index < frame.source.length; index += 1) {
        if (index in frame.source) {
          frame.result[index] = cloneValue(frame.source[index]);
        }
      }
      continue;
    }

    for (const key of Object.keys(frame.source).sort()) {
      defineJsonProperty(frame.result, key, cloneValue(frame.source[key]));
    }
  }
  return result;
};
