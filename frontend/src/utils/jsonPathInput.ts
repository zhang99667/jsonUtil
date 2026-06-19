export interface JsonPathQueryNormalization {
  query: string;
  isFieldNameShortcut: boolean;
}

const FIELD_NAME_SHORTCUT_RE = /^[\p{L}\p{N}_$-][\p{L}\p{N}_$.-]*$/u;
const JSONPATH_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const formatRecursiveFieldQuery = (fieldName: string): string => (
  JSONPATH_IDENTIFIER_RE.test(fieldName)
    ? `$..${fieldName}`
    : `$..[${JSON.stringify(fieldName)}]`
);

export const normalizeJsonPathQueryInput = (input: string): JsonPathQueryNormalization => {
  const query = input.trim();
  if (!query) return { query: '', isFieldNameShortcut: false };
  if (query.startsWith('$') || query.startsWith('@') || query.startsWith('[')) {
    return { query, isFieldNameShortcut: false };
  }
  if (!FIELD_NAME_SHORTCUT_RE.test(query)) {
    return { query, isFieldNameShortcut: false };
  }

  return {
    query: formatRecursiveFieldQuery(query),
    isFieldNameShortcut: true,
  };
};
