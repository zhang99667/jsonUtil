import { readObjectPropertySafely } from './storage';

const ERROR_TEXT_FIELDS = ['name', 'message', 'stack'] as const;
const NESTED_ERROR_FIELDS = ['cause', 'reason', 'error', 'detail', 'payload'] as const;
const MAX_CHUNK_LOAD_ERROR_VALUES = 10_000;

const isErrorValue = (value: unknown): boolean => (
  typeof value === 'string' || (typeof value === 'object' && value !== null)
);

const readNestedErrorItems = (record: object, limit: number): unknown[] => {
  if (limit <= 0) return [];
  const value = readObjectPropertySafely(record, 'errors');
  try {
    if (!Array.isArray(value)) return [];

    const items: unknown[] = [];
    const length = Math.min(value.length, limit);
    for (let index = 0; index < length; index += 1) {
      const item = readObjectPropertySafely(value, String(index));
      if (isErrorValue(item)) items.push(item);
    }
    return items;
  } catch {
    return [];
  }
};

export const someChunkLoadErrorMessage = (
  error: unknown,
  predicate: (message: string) => boolean,
  visited = new Set<object>()
): boolean => {
  const pending: unknown[] = [error];
  let scheduledValues = 1;

  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current === 'string') {
      if (predicate(current)) return true;
      continue;
    }
    if (!current || typeof current !== 'object' || visited.has(current)) continue;

    visited.add(current);
    for (const field of ERROR_TEXT_FIELDS) {
      const value = readObjectPropertySafely(current, field);
      if (typeof value === 'string' && predicate(value)) return true;
    }

    const remainingValues = MAX_CHUNK_LOAD_ERROR_VALUES - scheduledValues;
    if (remainingValues <= 0) continue;

    const nestedValues = NESTED_ERROR_FIELDS
      .map(field => readObjectPropertySafely(current, field))
      .filter(isErrorValue);
    const prioritizedNestedValues = nestedValues.slice(0, remainingValues);
    const children = [
      ...prioritizedNestedValues,
      ...readNestedErrorItems(current, remainingValues - prioritizedNestedValues.length),
    ];
    scheduledValues += children.length;
    for (let index = children.length - 1; index >= 0; index -= 1) {
      pending.push(children[index]);
    }
  }

  return false;
};
