const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

export const encodeJsonPointerSegment = (segment: string): string => (
  segment.replace(/~/g, '~0').replace(/\//g, '~1')
);

export const decodeJsonPointerSegment = (segment: string): string => (
  segment.replace(/~1/g, '/').replace(/~0/g, '~')
);

const parseArrayIndex = (segment: string, arrayLength: number): number => {
  if (!/^(0|[1-9]\d*)$/.test(segment)) {
    throw new Error(`非法数组下标: ${segment}`);
  }

  const index = Number(segment);
  if (index < 0 || index >= arrayLength) {
    throw new Error(`数组下标越界: ${segment}`);
  }

  return index;
};

/**
 * 按 JSON Pointer 精确读取 JSON 树中的值
 */
export const getJsonPointerValue = (
  root: unknown,
  pointer: string
): unknown => {
  if (pointer === '') {
    return root;
  }

  if (!pointer.startsWith('/')) {
    throw new Error(`非法 JSON Pointer: ${pointer}`);
  }

  const segments = pointer.slice(1).split('/').map(decodeJsonPointerSegment);
  let current = root;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      current = current[parseArrayIndex(segment, current.length)];
      continue;
    }

    if (isRecord(current) && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
      continue;
    }

    throw new Error(`JSON Pointer 无法继续访问: ${pointer}`);
  }

  return current;
};

export const stringifyJsonPointerValue = (
  root: unknown,
  pointer: string,
  options: { pretty?: boolean } = {}
): string => (
  JSON.stringify(getJsonPointerValue(root, pointer), null, options.pretty ? 2 : 0) ?? ''
);

/**
 * 按 JSON Pointer 精确替换 JSON 树中的值
 * @returns 替换后的根节点；当 pointer 指向根节点时会返回新值
 */
export const setJsonPointerValue = (
  root: unknown,
  pointer: string,
  value: unknown
): unknown => {
  if (pointer === '') {
    return value;
  }

  if (!pointer.startsWith('/')) {
    throw new Error(`非法 JSON Pointer: ${pointer}`);
  }

  const segments = pointer.slice(1).split('/').map(decodeJsonPointerSegment);
  let current = root;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];

    if (Array.isArray(current)) {
      current = current[parseArrayIndex(segment, current.length)];
      continue;
    }

    if (isRecord(current)) {
      current = current[segment];
      continue;
    }

    throw new Error(`JSON Pointer 无法继续访问: ${pointer}`);
  }

  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    current[parseArrayIndex(lastSegment, current.length)] = value;
    return root;
  }

  if (isRecord(current)) {
    current[lastSegment] = value;
    return root;
  }

  throw new Error(`JSON Pointer 无法写入: ${pointer}`);
};
