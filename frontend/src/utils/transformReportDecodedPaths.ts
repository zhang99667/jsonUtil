import type { JsonValue } from '../types';
import type { TransformDecodedLeaf } from './transformReportDecodedLeafWalker';
import { walkTransformDecodedLeaves } from './transformReportDecodedLeafWalker';
import { formatDecodedPathCopyValue } from './transformValuePreview';
import type { TransformReportDecodedPath } from './transformSummary';
import {
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
  leaf: TransformDecodedLeaf
): DecodedPathCollectRow => ({
  path: leaf.path,
  preview: leaf.preview,
  valueText: formatDecodedPathCopyValue(leaf.value),
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

const collectDecodedPathRows = (
  decodedValue: JsonValue,
  state: DecodedPathCollectState
) => {
  walkTransformDecodedLeaves(decodedValue, '$', leaf => {
    pushDecodedPath(state, createDecodedPathRow(leaf));
    return !state.isCountTruncated;
  });
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
  collectDecodedPathRows(decodedValue, state);

  return {
    decodedPaths: state.rows.map(row => rebaseDecodedPathRow(recordPath, row)),
    decodedPathCount: state.count,
    isDecodedPathCountTruncated: state.isCountTruncated,
    hasMoreDecodedPaths: state.hasMore,
  };
};
