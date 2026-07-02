import type { JsonValue } from '../types';
import type { TransformDecodedLeaf } from './transformReportDecodedLeafWalker';
import { walkTransformDecodedLeaves } from './transformReportDecodedLeafWalker';
import type { TransformReportDecodedPath } from './transformSummary';

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
  leaf: TransformDecodedLeaf
) => {
  if (state.rows.length < state.rowLimit) {
    state.rows.push({
      path: leaf.path,
      preview: leaf.preview,
      value: leaf.value,
    });
  }

  if (state.remainingLength > 0) {
    const part = `${leaf.path} ${leaf.preview}`;
    const nextPart = part.length > state.remainingLength
      ? part.slice(0, state.remainingLength)
      : part;
    state.parts.push(nextPart);
    state.remainingLength -= nextPart.length + 1;
  }
};

const collectDecodedSearchText = (
  decodedValue: JsonValue,
  recordPath: string,
  state: DecodedSearchTextCollectState
) => {
  walkTransformDecodedLeaves(decodedValue, recordPath, leaf => {
    pushDecodedSearchText(state, leaf);
    return state.remainingLength > 0 || state.rows.length < state.rowLimit;
  });
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
