import { JSONPath } from 'jsonpath-plus';
import { appendJsonPointerSegment, setJsonPointerValue } from './jsonPointer';

export const setLegacyJsonPathValue = (root: unknown, jsonPath: string, value: string): unknown => {
  const segments = JSONPath.toPathArray(jsonPath);
  if (segments[0] !== '$') {
    throw new Error(`非法 JSONPath: ${jsonPath}`);
  }

  const pointer = segments
    .slice(1)
    .reduce(appendJsonPointerSegment, '');

  return setJsonPointerValue(root, pointer, value);
};
