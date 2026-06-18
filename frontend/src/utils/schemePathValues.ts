export const DEFAULT_SCHEME_PATH_VALUE_COPY_ROW_LIMIT = 500;

interface SchemePathValueCollectState {
  rows: string[];
  limit: number;
  isTruncated: boolean;
}

export interface SchemePathValueCopyResult {
  text: string;
  rowCount: number;
  isTruncated: boolean;
}

export interface SchemePathValueCopyOptions {
  limit?: number;
}

const formatJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const formatJsonPathValue = (value: unknown): string => {
  if (typeof value === 'string') return JSON.stringify(value);
  return JSON.stringify(value) ?? String(value);
};

const pushSchemePathValueRow = (
  state: SchemePathValueCollectState,
  path: string,
  value: unknown
) => {
  if (state.rows.length >= state.limit) {
    state.isTruncated = true;
    return;
  }

  state.rows.push(`${path} = ${formatJsonPathValue(value)}`);
};

const collectSchemePathValues = (
  value: unknown,
  path: string,
  state: SchemePathValueCollectState
) => {
  if (state.isTruncated) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushSchemePathValueRow(state, path, value);
      return;
    }

    for (let index = 0; index < value.length; index++) {
      collectSchemePathValues(value[index], `${path}[${index}]`, state);
      if (state.isTruncated) return;
    }
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      pushSchemePathValueRow(state, path, value);
      return;
    }

    for (const [key, item] of entries) {
      collectSchemePathValues(item, formatJsonPathKey(path, key), state);
      if (state.isTruncated) return;
    }
    return;
  }

  pushSchemePathValueRow(state, path, value);
};

export const buildSchemePathValuesForCopy = (
  content: string,
  options: SchemePathValueCopyOptions = {}
): SchemePathValueCopyResult | null => {
  try {
    const parsed: unknown = JSON.parse(content);
    const state: SchemePathValueCollectState = {
      rows: [],
      limit: options.limit ?? DEFAULT_SCHEME_PATH_VALUE_COPY_ROW_LIMIT,
      isTruncated: false,
    };

    collectSchemePathValues(parsed, '$', state);
    const text = [
      ...state.rows,
      ...(state.isTruncated ? ['... 还有更多路径未复制'] : []),
    ].join('\n');

    return {
      text,
      rowCount: state.rows.length,
      isTruncated: state.isTruncated,
    };
  } catch {
    return null;
  }
};

export const formatSchemePathValueCountLabel = (rowCount: number, isTruncated: boolean): string => (
  isTruncated ? `已返回 ${rowCount} 项` : `${rowCount} 项`
);
