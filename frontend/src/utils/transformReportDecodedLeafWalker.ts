import type { JsonValue } from '../types';
import {
  appendTransformJsonPathIndex,
  appendTransformJsonPathKey,
} from './transformReportJsonPath';
import { formatJsonValuePreview } from './transformValuePreview';

export interface TransformDecodedLeaf {
  path: string;
  preview: string;
  value: JsonValue;
}

type TransformDecodedLeafVisitor = (leaf: TransformDecodedLeaf) => boolean | void;

interface DecodedLeafTask {
  path: string;
  value: JsonValue;
}

export const walkTransformDecodedLeaves = (
  value: JsonValue,
  startPath: string,
  visitor: TransformDecodedLeafVisitor
) => {
  const pending: DecodedLeafTask[] = [{ path: startPath, value }];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;

    if (Array.isArray(current.value)) {
      if (current.value.length === 0) {
        if (visitor({ ...current, preview: '数组 0 项' }) === false) return;
        continue;
      }

      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        pending.push({
          path: appendTransformJsonPathIndex(current.path, index),
          value: current.value[index],
        });
      }
      continue;
    }

    if (current.value && typeof current.value === 'object') {
      const entries = Object.entries(current.value);
      if (entries.length === 0) {
        if (visitor({ ...current, preview: '对象: 空' }) === false) return;
        continue;
      }

      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [key, item] = entries[index];
        pending.push({
          path: appendTransformJsonPathKey(current.path, key),
          value: item,
        });
      }
      continue;
    }

    if (visitor({
      ...current,
      preview: formatJsonValuePreview(current.value, 80),
    }) === false) return;
  }
};
