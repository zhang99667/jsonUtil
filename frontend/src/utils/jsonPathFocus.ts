import type { JsonValue } from '../types';

export type JsonPathSegment = string | number;

// 只解析本工具生成的 JSONPath，用于把筛选命中的内部 CMD 字段投影成聚焦 cmdParams。
export const parseGeneratedJsonPath = (path: string): JsonPathSegment[] | null => {
  if (!path.startsWith('$')) return null;

  const segments: JsonPathSegment[] = [];
  let index = 1;
  while (index < path.length) {
    const current = path[index];
    if (current === '.') {
      const start = index + 1;
      index = start;
      while (index < path.length && path[index] !== '.' && path[index] !== '[') {
        index += 1;
      }
      const key = path.slice(start, index);
      if (!key) return null;
      segments.push(key);
      continue;
    }

    if (current === '[') {
      const end = path.indexOf(']', index + 1);
      if (end < 0) return null;

      const rawSegment = path.slice(index + 1, end);
      if (/^\d+$/.test(rawSegment)) {
        segments.push(Number(rawSegment));
      } else {
        try {
          const parsed = JSON.parse(rawSegment) as unknown;
          if (typeof parsed !== 'string') return null;
          segments.push(parsed);
        } catch {
          return null;
        }
      }
      index = end + 1;
      continue;
    }

    return null;
  }

  return segments;
};

export const getJsonValueBySegments = (
  value: JsonValue,
  segments: JsonPathSegment[]
): JsonValue | undefined => {
  let current: JsonValue | undefined = value;
  for (const segment of segments) {
    if (current === undefined || current === null || typeof current !== 'object') return undefined;

    current = Array.isArray(current)
      ? typeof segment === 'number' ? current[segment] : undefined
      : current[segment];
  }

  return current;
};

export const getJsonPathLeafKey = (path: string): string => {
  const segments = parseGeneratedJsonPath(path);
  if (!segments) return path;

  for (let index = segments.length - 1; index >= 0; index--) {
    const segment = segments[index];
    if (typeof segment === 'string') return segment;
  }

  return path;
};

const createJsonPathContainer = (segment?: JsonPathSegment): JsonValue => (
  typeof segment === 'number' ? [] : {}
);

const setJsonValueBySegments = (
  target: JsonValue,
  segments: JsonPathSegment[],
  value: JsonValue
) => {
  if (segments.length === 0) return;

  let current = target;
  for (let index = 0; index < segments.length - 1; index++) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    if (current === null || typeof current !== 'object') return;

    if (Array.isArray(current)) {
      if (typeof segment !== 'number') return;
      if (current[segment] === undefined || current[segment] === null || typeof current[segment] !== 'object') {
        current[segment] = createJsonPathContainer(nextSegment);
      }
      current = current[segment];
      continue;
    }

    if (typeof segment !== 'string') return;
    if (current[segment] === undefined || current[segment] === null || typeof current[segment] !== 'object') {
      current[segment] = createJsonPathContainer(nextSegment);
    }
    current = current[segment];
  }

  if (current === null || typeof current !== 'object') return;

  const leaf = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (typeof leaf === 'number') current[leaf] = value;
    return;
  }

  if (typeof leaf === 'string') {
    current[leaf] = value;
  }
};

const getRelativeNestedFieldPath = (basePath: string, nestedFieldPath: string): string | null => {
  if (nestedFieldPath === basePath) return '$';
  if (!nestedFieldPath.startsWith(basePath)) return null;

  const suffix = nestedFieldPath.slice(basePath.length);
  return suffix.startsWith('.') || suffix.startsWith('[') ? `$${suffix}` : null;
};

export const buildFocusedJsonValue = (
  decodedValue: JsonValue,
  basePath: string,
  focusedFieldPaths: string[]
): JsonValue | null => {
  let focusedRoot: JsonValue | null = null;
  let hasFocusedValue = false;

  focusedFieldPaths.forEach(path => {
    const relativePath = getRelativeNestedFieldPath(basePath, path);
    if (!relativePath) return;

    const segments = parseGeneratedJsonPath(relativePath);
    if (!segments || segments.length === 0) return;

    const value = getJsonValueBySegments(decodedValue, segments);
    if (value === undefined) return;

    if (focusedRoot === null) {
      focusedRoot = createJsonPathContainer(segments[0]);
    }
    setJsonValueBySegments(focusedRoot, segments, value);
    hasFocusedValue = true;
  });

  return hasFocusedValue ? focusedRoot : null;
};
