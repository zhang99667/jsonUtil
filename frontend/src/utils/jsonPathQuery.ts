import { JSONPath } from 'jsonpath-plus';
import { parse as parseJsonSourceMap } from 'json-source-map';
import type { HighlightRange } from '../types';
import { deepParseWithContext } from './transformations';

export interface JsonPathQueryOptions {
  deepFormat?: boolean;
  autoExpandScheme?: boolean;
}

export interface JsonPathQueryResult {
  ranges: HighlightRange[];
  values: unknown[];
  totalResults: number;
}

type JsonPathJson = null | boolean | number | string | object | unknown[];

interface JsonPathMatch {
  pointer: string;
  value: unknown;
}

const toHighlightRange = (
  pointer: string,
  pointers: ReturnType<typeof parseJsonSourceMap>['pointers']
): HighlightRange | null => {
  const pointerInfo = pointers[pointer];
  if (!pointerInfo) return null;

  const loc = pointerInfo.value || pointerInfo.key;
  if (!loc) return null;

  const endLoc = pointerInfo.valueEnd || pointerInfo.keyEnd || loc;

  return {
    startLine: loc.line + 1,
    startColumn: loc.column + 1,
    endLine: endLoc.line + 1,
    endColumn: endLoc.column + 1,
  };
};

/**
 * 查询 JSONPath 并返回可直接用于 Monaco 高亮的范围
 */
export const queryJsonPathRanges = (
  jsonData: string,
  query: string,
  options: JsonPathQueryOptions = {}
): JsonPathQueryResult => {
  const source = options.deepFormat
    ? deepParseWithContext(jsonData, {
      autoExpandScheme: options.autoExpandScheme,
    }).output
    : jsonData;

  let parsedData: JsonPathJson;
  try {
    parsedData = JSON.parse(source) as JsonPathJson;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`JSON 解析错误: ${message}`);
  }

  let matches: JsonPathMatch[];
  try {
    matches = JSONPath<JsonPathMatch[]>({
      path: query,
      json: parsedData,
      resultType: 'all',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`JSONPath 查询错误: ${message}`);
  }

  if (!matches || matches.length === 0) {
    return { ranges: [], values: [], totalResults: 0 };
  }

  const sourceMap = parseJsonSourceMap(source);
  const results = matches
    .map(match => ({
      range: toHighlightRange(match.pointer, sourceMap.pointers),
      value: match.value,
    }))
    .filter((result): result is { range: HighlightRange; value: unknown } => result.range !== null);

  return {
    ranges: results.map(result => result.range),
    values: results.map(result => result.value),
    totalResults: results.length,
  };
};
