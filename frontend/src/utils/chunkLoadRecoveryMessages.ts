const ERROR_TEXT_FIELDS = ['name', 'message', 'stack'] as const;
const NESTED_ERROR_FIELDS = ['cause', 'reason', 'error', 'detail', 'payload'] as const;

export const collectChunkLoadErrorMessages = (
  error: unknown,
  visited = new Set<object>()
): string[] => {
  if (typeof error === 'string') return [error];
  if (!error || typeof error !== 'object') return [];
  if (visited.has(error)) return [];

  visited.add(error);
  const record = error as Record<string, unknown>;
  const nestedErrors = Array.isArray(record.errors) ? record.errors : [];
  return [
    ...ERROR_TEXT_FIELDS
      .map(field => record[field])
      .filter((value): value is string => typeof value === 'string'),
    ...NESTED_ERROR_FIELDS.flatMap(field => collectChunkLoadErrorMessages(record[field], visited)),
    ...nestedErrors.flatMap(item => collectChunkLoadErrorMessages(item, visited)),
  ];
};
