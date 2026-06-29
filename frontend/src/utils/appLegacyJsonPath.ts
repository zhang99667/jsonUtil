export const setLegacyJsonPathValue = (root: unknown, jsonPath: string, value: string): unknown => {
  const pathParts = jsonPath
    .replace(/^\$\.?/, '')
    .split(/\.|\[|\]/)
    .filter(p => p !== '');

  let current = root as Record<string, unknown> | unknown[];
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    const index = Number.parseInt(part, 10);
    current = (Number.isNaN(index)
      ? (current as Record<string, unknown>)[part]
      : (current as unknown[])[index]) as Record<string, unknown> | unknown[];
  }

  const lastPart = pathParts[pathParts.length - 1];
  const lastIndex = Number.parseInt(lastPart, 10);
  if (Number.isNaN(lastIndex)) {
    (current as Record<string, unknown>)[lastPart] = value;
  } else {
    (current as unknown[])[lastIndex] = value;
  }

  return root;
};
