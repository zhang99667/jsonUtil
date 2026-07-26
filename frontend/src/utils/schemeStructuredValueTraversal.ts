import type { JsonObject, JsonValue } from '../types';
import { defineJsonProperty } from './jsonObjectProperty';
import { formatJsonPathKeySegment } from './jsonPathSegments';
import type { StructuredValue } from './schemeTypes';

interface SchemeStructuredValueTraversalOptions {
  transformString: (value: string, path: string) => StructuredValue;
  shouldPreserveProperty: (key: string, value: StructuredValue) => boolean;
}

type SchemeStructuredValueTarget =
  | { kind: 'root' }
  | { kind: 'array'; parent: StructuredValue[]; index: number }
  | { kind: 'object'; parent: JsonObject; key: string };

interface SchemeStructuredValueTask {
  path: string;
  target: SchemeStructuredValueTarget;
  value: StructuredValue;
}

export const transformSchemeStructuredValue = (
  value: StructuredValue,
  path: string,
  options: SchemeStructuredValueTraversalOptions,
): StructuredValue => {
  let rootResult = value;
  const writeResult = (
    target: SchemeStructuredValueTarget,
    result: StructuredValue,
  ): void => {
    if (target.kind === 'root') {
      rootResult = result;
    } else if (target.kind === 'array') {
      target.parent[target.index] = result;
    } else {
      defineJsonProperty(target.parent, target.key, result as JsonValue);
    }
  };
  const pending: SchemeStructuredValueTask[] = [{
    path,
    target: { kind: 'root' },
    value,
  }];

  while (pending.length > 0) {
    const task = pending.pop();
    if (!task) continue;
    if (
      task.target.kind === 'object'
      && options.shouldPreserveProperty(task.target.key, task.value)
    ) {
      continue;
    }

    if (typeof task.value === 'string') {
      writeResult(task.target, options.transformString(task.value, task.path));
      continue;
    }
    if (Array.isArray(task.value)) {
      const result = new Array<StructuredValue>(task.value.length);
      writeResult(task.target, result);
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(task.value, index)) continue;
        pending.push({
          path: `${task.path}[${index}]`,
          target: { kind: 'array', parent: result, index },
          value: task.value[index],
        });
      }
      continue;
    }
    if (task.value && typeof task.value === 'object') {
      const result: JsonObject = {};
      const entries = Object.entries(task.value);
      writeResult(task.target, result);
      for (const [key, item] of entries) {
        defineJsonProperty(result, key, item as JsonValue);
      }
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [key, item] = entries[index];
        pending.push({
          path: `${task.path}${formatJsonPathKeySegment(key)}`,
          target: { kind: 'object', parent: result, key },
          value: item,
        });
      }
      continue;
    }
    writeResult(task.target, task.value);
  }

  return rootResult;
};
