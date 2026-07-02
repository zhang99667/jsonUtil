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

const visitDecodedLeaf = (
  value: JsonValue,
  currentPath: string,
  visitor: TransformDecodedLeafVisitor
): boolean => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return visitor({ path: currentPath, preview: '数组 0 项', value }) !== false;
    }

    for (let index = 0; index < value.length; index++) {
      if (!visitDecodedLeaf(value[index], appendTransformJsonPathIndex(currentPath, index), visitor)) {
        return false;
      }
    }
    return true;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return visitor({ path: currentPath, preview: '对象: 空', value }) !== false;
    }

    for (const [key, item] of entries) {
      if (!visitDecodedLeaf(item, appendTransformJsonPathKey(currentPath, key), visitor)) {
        return false;
      }
    }
    return true;
  }

  return visitor({
    path: currentPath,
    preview: formatJsonValuePreview(value, 80),
    value,
  }) !== false;
};

export const walkTransformDecodedLeaves = (
  value: JsonValue,
  startPath: string,
  visitor: TransformDecodedLeafVisitor
) => {
  visitDecodedLeaf(value, startPath, visitor);
};
