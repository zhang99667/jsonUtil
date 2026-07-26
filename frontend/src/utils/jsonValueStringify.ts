import type { JsonObject, JsonValue } from '../types.ts';
import { isJsonObject } from './jsonValueGuards.ts';

type StringifyTask =
  | { kind: 'value'; value: JsonValue; depth: number }
  | { kind: 'text'; value: string }
  | { kind: 'leave'; value: JsonObject | JsonValue[] };

const getIndentUnit = (space?: number | string): string => {
  if (typeof space === 'number') {
    return ' '.repeat(Math.min(10, Math.max(0, Math.floor(space))));
  }
  return typeof space === 'string' ? space.slice(0, 10) : '';
};

export const stringifyJsonValue = (
  value: JsonValue,
  space?: number | string,
): string => {
  const indentUnit = getIndentUnit(space);
  const ancestors = new WeakSet<object>();
  const chunks: string[] = [];
  const pending: StringifyTask[] = [{ kind: 'value', value, depth: 0 }];
  const indentCache = [''];
  const getIndent = (depth: number): string => {
    while (indentCache.length <= depth) {
      indentCache.push(indentCache[indentCache.length - 1] + indentUnit);
    }
    return indentCache[depth];
  };

  while (pending.length > 0) {
    const task = pending.pop();
    if (!task) continue;
    if (task.kind === 'text') {
      chunks.push(task.value);
      continue;
    }
    if (task.kind === 'leave') {
      ancestors.delete(task.value);
      continue;
    }

    const current = task.value;
    if (!Array.isArray(current) && !isJsonObject(current)) {
      chunks.push(JSON.stringify(current));
      continue;
    }
    if (ancestors.has(current)) throw new TypeError('Converting circular structure to JSON');

    const isArray = Array.isArray(current);
    const keys = isArray
      ? Array.from({ length: current.length }, (_, index) => String(index))
      : Object.keys(current);
    const opening = isArray ? '[' : '{';
    const closing = isArray ? ']' : '}';
    chunks.push(opening);
    if (keys.length === 0) {
      chunks.push(closing);
      continue;
    }

    ancestors.add(current);
    pending.push({ kind: 'leave', value: current });
    pending.push({
      kind: 'text',
      value: `${indentUnit ? `\n${getIndent(task.depth)}` : ''}${closing}`,
    });
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index];
      const child = isArray
        ? current[Number(key)] ?? null
        : current[key];
      const prefix = `${index > 0 ? ',' : ''}${indentUnit ? `\n${getIndent(task.depth + 1)}` : ''}`;
      pending.push({ kind: 'value', value: child, depth: task.depth + 1 });
      pending.push({
        kind: 'text',
        value: isArray ? prefix : `${prefix}${JSON.stringify(key)}:${indentUnit ? ' ' : ''}`,
      });
    }
  }

  return chunks.join('');
};
