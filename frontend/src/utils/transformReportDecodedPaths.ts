import type { JsonValue } from '../types';
import { formatDecodedPathCopyValue, formatJsonValuePreview } from './transformValuePreview';
import type { TransformReportDecodedPath } from './transformSummary';
import {
  appendTransformJsonPathIndex,
  appendTransformJsonPathKey,
  joinTransformJsonPath,
} from './transformReportJsonPath';

export { buildTransformDecodedSearchData } from './transformReportDecodedSearchData';
export type { TransformDecodedSearchData } from './transformReportDecodedSearchData';

export const DEFAULT_DECODED_PATH_LIMIT = 12;
const DEFAULT_DECODED_PATH_COUNT_LIMIT = 10_000;

interface DecodedPathCollectState {
  rows: DecodedPathCollectRow[];
  limit: number;
  hasMore: boolean;
  count: number;
  countLimit: number;
  isCountTruncated: boolean;
}

interface DecodedPathCollectRow {
  path: string;
  preview: string;
  valueText: string;
}

export interface TransformDecodedPathData {
  decodedPaths: TransformReportDecodedPath[];
  decodedPathCount: number;
  isDecodedPathCountTruncated: boolean;
  hasMoreDecodedPaths: boolean;
}

const createDecodedPathRow = (
  path: string,
  value: JsonValue,
  preview = formatJsonValuePreview(value, 80)
): DecodedPathCollectRow => ({
  path,
  preview,
  valueText: formatDecodedPathCopyValue(value),
});

const rebaseDecodedPathRow = (
  basePath: string,
  row: DecodedPathCollectRow
): TransformReportDecodedPath => {
  const path = joinTransformJsonPath(basePath, row.path);

  return {
    path,
    preview: row.preview,
    copyText: `${path} = ${row.valueText}`,
  };
};

const pushDecodedPath = (
  state: DecodedPathCollectState,
  row: DecodedPathCollectRow
) => {
  if (state.count >= state.countLimit) {
    state.hasMore = true;
    state.isCountTruncated = true;
    return;
  }

  state.count += 1;

  if (state.rows.length < state.limit) {
    state.rows.push(row);
    return;
  }

  state.hasMore = true;
};

const collectDecodedLeafPaths = (
  value: JsonValue,
  currentPath: string,
  state: DecodedPathCollectState
) => {
  if (state.isCountTruncated) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushDecodedPath(state, createDecodedPathRow(currentPath, value, '数组 0 项'));
      return;
    }

    for (let index = 0; index < value.length; index++) {
      collectDecodedLeafPaths(value[index], appendTransformJsonPathIndex(currentPath, index), state);
      if (state.isCountTruncated) return;
    }
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      pushDecodedPath(state, createDecodedPathRow(currentPath, value, '对象: 空'));
      return;
    }

    for (const [key, item] of entries) {
      collectDecodedLeafPaths(item, appendTransformJsonPathKey(currentPath, key), state);
      if (state.isCountTruncated) return;
    }
    return;
  }

  pushDecodedPath(state, createDecodedPathRow(currentPath, value));
};

export const buildTransformDecodedPaths = (
  recordPath: string,
  decodedValue: JsonValue | undefined,
  limit = DEFAULT_DECODED_PATH_LIMIT
): TransformDecodedPathData => {
  if (decodedValue === undefined || decodedValue === null || typeof decodedValue !== 'object') {
    return {
      decodedPaths: [],
      decodedPathCount: 0,
      isDecodedPathCountTruncated: false,
      hasMoreDecodedPaths: false,
    };
  }

  const state: DecodedPathCollectState = {
    rows: [],
    limit,
    hasMore: false,
    count: 0,
    countLimit: DEFAULT_DECODED_PATH_COUNT_LIMIT,
    isCountTruncated: false,
  };
  collectDecodedLeafPaths(decodedValue, '$', state);

  return {
    decodedPaths: state.rows.map(row => rebaseDecodedPathRow(recordPath, row)),
    decodedPathCount: state.count,
    isDecodedPathCountTruncated: state.isCountTruncated,
    hasMoreDecodedPaths: state.hasMore,
  };
};
