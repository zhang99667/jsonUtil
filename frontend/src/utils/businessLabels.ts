const trimBusinessLabel = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const getBusinessLabelForField = (
  container: Record<string, unknown>,
  key: string
): string | undefined => {
  if (key === 'v') return trimBusinessLabel(container.k);
  if (key === 'value') return trimBusinessLabel(container.key) || trimBusinessLabel(container.name);
  return undefined;
};
