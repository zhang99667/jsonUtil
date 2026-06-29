import type { JsonValue } from '../types';
import type { TransformReportDecodedPath } from './transformSummary';
import {
  appendTransformJsonPathIndex,
  appendTransformJsonPathKey,
} from './transformReportJsonPath';
import { formatJsonValuePreview } from './transformValuePreview';

const DEFAULT_DECODED_SEARCH_TEXT_LIMIT = 20_000;
const DEFAULT_DECODED_SEARCH_PATH_LIMIT = 1_000;

interface DecodedSearchTextCollectState {
  parts: string[];
  rows: TransformReportDecodedPath[];
  remainingLength: number;
  rowLimit: number;
}

export interface TransformDecodedSearchData {
  decodedSearchText?: string;
  decodedSearchPaths?: TransformReportDecodedPath[];
}

const pushDecodedSearchText = (
  state: DecodedSearchTextCollectState,
  path: string,
  value: JsonValue,
  preview = formatJsonValuePreview(value, 80)
) => {
  if (state.rows.length < state.rowLimit) {
    state.rows.push({
      path,
      preview,
      value,
    });
  }

  if (state.remainingLength > 0) {
    const part = `${path} ${preview}`;
    const nextPart = part.length > state.remainingLength
      ? part.slice(0, state.remainingLength)
      : part;
    state.parts.push(nextPart);
    state.remainingLength -= nextPart.length + 1;
  }
};

const collectDecodedSearchText = (
  value: JsonValue,
  currentPath: string,
  state: DecodedSearchTextCollectState
) => {
  if (state.remainingLength <= 0 && state.rows.length >= state.rowLimit) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushDecodedSearchText(state, currentPath, value, '数组 0 项');
      return;
    }

    for (let index = 0; index < value.length; index++) {
      collectDecodedSearchText(value[index], appendTransformJsonPathIndex(currentPath, index), state);
      if (state.remainingLength <= 0 && state.rows.length >= state.rowLimit) return;
    }
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      pushDecodedSearchText(state, currentPath, value, '对象: 空');
      return;
    }

    for (const [key, item] of entries) {
      collectDecodedSearchText(item, appendTransformJsonPathKey(currentPath, key), state);
      if (state.remainingLength <= 0 && state.rows.length >= state.rowLimit) return;
    }
    return;
  }

  pushDecodedSearchText(state, currentPath, value);
};

export const buildTransformDecodedSearchData = (
  recordPath: string,
  decodedValue: JsonValue | undefined,
  textLimit = DEFAULT_DECODED_SEARCH_TEXT_LIMIT,
  pathLimit = DEFAULT_DECODED_SEARCH_PATH_LIMIT
): TransformDecodedSearchData => {
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return {};
  }

  const state: DecodedSearchTextCollectState = {
    parts: [],
    rows: [],
    remainingLength: textLimit,
    rowLimit: pathLimit,
  };
  collectDecodedSearchText(decodedValue, recordPath, state);

  return {
    ...(state.parts.length > 0 ? { decodedSearchText: state.parts.join('\n') } : {}),
    ...(state.rows.length > 0 ? { decodedSearchPaths: state.rows } : {}),
  };
};
