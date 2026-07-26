import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { parseJsonValue } from './jsonValueGuards';
import { formatDecodedPathCopyValue } from './transformValuePreview';

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

type SchemePathValueCollectTask =
  | { kind: 'value'; path: string; value: unknown }
  | { kind: 'array'; index: number; path: string; value: unknown[] }
  | {
      kind: 'object';
      index: number;
      keys: string[];
      path: string;
      value: Record<string, unknown>;
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

  state.rows.push(`${path} = ${formatDecodedPathCopyValue(value)}`);
};

const collectSchemePathValues = (
  value: unknown,
  path: string,
  state: SchemePathValueCollectState
) => {
  const pending: SchemePathValueCollectTask[] = [{ kind: 'value', path, value }];
  while (pending.length > 0 && !state.isTruncated) {
    const task = pending.pop();
    if (!task) break;

    if (task.kind === 'array') {
      const nextIndex = task.index + 1;
      if (nextIndex < task.value.length) {
        pending.push({ ...task, index: nextIndex });
      }
      pending.push({
        kind: 'value',
        path: appendJsonPathIndex(task.path, task.index),
        value: task.value[task.index],
      });
      continue;
    }

    if (task.kind === 'object') {
      const key = task.keys[task.index];
      const nextIndex = task.index + 1;
      if (nextIndex < task.keys.length) {
        pending.push({ ...task, index: nextIndex });
      }
      pending.push({
        kind: 'value',
        path: appendJsonPathKey(task.path, key),
        value: task.value[key],
      });
      continue;
    }

    if (Array.isArray(task.value)) {
      if (task.value.length === 0) {
        pushSchemePathValueRow(state, task.path, task.value);
      } else {
        pending.push({ kind: 'array', index: 0, path: task.path, value: task.value });
      }
      continue;
    }

    if (task.value && typeof task.value === 'object') {
      const record = task.value as Record<string, unknown>;
      const keys = Object.keys(record);
      if (keys.length === 0) {
        pushSchemePathValueRow(state, task.path, task.value);
      } else {
        pending.push({ kind: 'object', index: 0, keys, path: task.path, value: record });
      }
      continue;
    }

    pushSchemePathValueRow(state, task.path, task.value);
  }
};

export const buildSchemePathValuesForCopy = (
  content: string,
  options: SchemePathValueCopyOptions = {}
): SchemePathValueCopyResult | null => {
  try {
    const parsed = parseJsonValue(content);
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
