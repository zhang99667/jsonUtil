const JSONPATH_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const JSONPATH_BRACKET_UNSAFE_KEY_RE = /['"\\\]\u0000-\u001F]/;

export const isJsonPathIdentifier = (value: string): boolean => (
  JSONPATH_IDENTIFIER_RE.test(value)
);

/**
 * 追加可直接执行的 JSONPath 对象键，特殊字符交给 JSON 字符串语法转义。
 */
export const formatJsonPathKeySegment = (key: string): string => (
  isJsonPathIdentifier(key)
    ? `.${key}`
    : JSONPATH_BRACKET_UNSAFE_KEY_RE.test(key)
      ? `[?(@property === ${JSON.stringify(key)})]`
      : `[${JSON.stringify(key)}]`
);

export const appendJsonPathKey = (path: string, key: string): string => (
  `${path}${formatJsonPathKeySegment(key)}`
);

export const appendJsonPathIndex = (path: string, index: number): string => (
  `${path}[${index}]`
);
