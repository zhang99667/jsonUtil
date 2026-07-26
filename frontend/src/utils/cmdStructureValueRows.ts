import type { JsonValue } from '../types';
import type { CmdStructureValueRow } from './cmdStructureValueDiffTypes';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { isJsonObject } from './jsonValueGuards';

interface CmdStructureValueRowTask {
  value: JsonValue;
  path: string;
}

export const collectCmdStructureValueRows = (
  value: JsonValue,
  path = '$'
): Map<string, CmdStructureValueRow> => {
  const rows = new Map<string, CmdStructureValueRow>();
  const pending: CmdStructureValueRowTask[] = [{ value, path }];

  while (pending.length > 0) {
    const task = pending.pop();
    if (!task) continue;

    if (Array.isArray(task.value)) {
      rows.set(task.path, { type: 'array', value: task.value });
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(task.value, index)) continue;
        pending.push({
          value: task.value[index],
          path: appendJsonPathIndex(task.path, index),
        });
      }
      continue;
    }

    if (isJsonObject(task.value)) {
      rows.set(task.path, { type: 'object', value: task.value });
      const entries = Object.entries(task.value);
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [key, item] = entries[index];
        pending.push({
          value: item,
          path: appendJsonPathKey(task.path, key),
        });
      }
      continue;
    }

    rows.set(task.path, {
      type: task.value === null ? 'null' : typeof task.value,
      value: task.value,
    });
  }
  return rows;
};
