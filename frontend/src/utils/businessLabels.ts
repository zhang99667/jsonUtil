const trimBusinessLabel = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const getBusinessLabelForField = (
  container: Record<string, unknown>,
  key: string
): string | undefined => {
  if (key === 'v') {
    return trimBusinessLabel(container.k) ||
      trimBusinessLabel(container.key) ||
      trimBusinessLabel(container.name);
  }

  if (key === 'value') {
    return trimBusinessLabel(container.key) ||
      trimBusinessLabel(container.k) ||
      trimBusinessLabel(container.name);
  }

  if (key === 'val' || key === 'content') {
    return trimBusinessLabel(container.key) ||
      trimBusinessLabel(container.k) ||
      trimBusinessLabel(container.name) ||
      trimBusinessLabel(container.field);
  }

  return undefined;
};
