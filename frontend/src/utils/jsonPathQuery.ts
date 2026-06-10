import { JSONPath } from 'jsonpath-plus';
import { parse as parseJsonSourceMap } from 'json-source-map';
import type { HighlightRange, JsonValue } from '../types';
import { parseJsonLinesWithMetadata, type JsonLineRecord } from './jsonLines';
import { deepParseWithContext } from './transformations';

export interface JsonPathQueryOptions {
  deepFormat?: boolean;
  autoExpandScheme?: boolean;
  resultLimit?: number;
}

export interface JsonPathQueryResult {
  ranges: HighlightRange[];
  values: unknown[];
  totalResults: number;
  isLimited: boolean;
  resultLimit: number;
}

interface JsonPathMatch {
  pointer: string;
  value: unknown;
}

export const DEFAULT_JSONPATH_RESULT_LIMIT = 1000;

type JsonSourceMapPointers = ReturnType<typeof parseJsonSourceMap>['pointers'];

class JsonPathResultLimitReached extends Error {
  constructor() {
    super('JSONPath result limit reached');
    this.name = 'JsonPathResultLimitReached';
  }
}

interface ParsedJsonPathSource {
  source: string;
  parsedData: JsonValue;
  jsonLines?: JsonLineRecord[];
  pointers?: JsonSourceMapPointers;
}

const parseJsonPathSource = (
  jsonData: string,
  options: JsonPathQueryOptions
): ParsedJsonPathSource => {
  const source = options.deepFormat
    ? deepParseWithContext(jsonData, {
      autoExpandScheme: options.autoExpandScheme,
    }).output
    : jsonData;

  try {
    const sourceMap = parseJsonSourceMap(source);
    return {
      source,
      parsedData: sourceMap.data as JsonValue,
      pointers: sourceMap.pointers,
    };
  } catch (error) {
    const jsonLines = parseJsonLinesWithMetadata(source);
    if (jsonLines) {
      return {
        source,
        parsedData: jsonLines.map(record => record.value),
        jsonLines,
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`JSON 解析错误: ${message}`);
  }
};

const decodeJsonPointerToken = (token: string): string => (
  token.replace(/~1/g, '/').replace(/~0/g, '~')
);

const encodeJsonPointerToken = (token: string): string => (
  token.replace(/~/g, '~0').replace(/\//g, '~1')
);

const toHighlightRange = (
  pointer: string,
  pointers: JsonSourceMapPointers
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

const offsetLineRange = (
  range: HighlightRange,
  record: JsonLineRecord
): HighlightRange => ({
  startLine: range.startLine + record.lineIndex,
  startColumn: range.startColumn + (range.startLine === 1 ? record.columnOffset : 0),
  endLine: range.endLine + record.lineIndex,
  endColumn: range.endColumn + (range.endLine === 1 ? record.columnOffset : 0),
});

const toJsonLineHighlightRange = (
  pointer: string,
  jsonLines: JsonLineRecord[],
  sourceMapCache: Map<number, JsonSourceMapPointers>
): HighlightRange | null => {
  if (!pointer) {
    const firstRecord = jsonLines[0];
    const lastRecord = jsonLines[jsonLines.length - 1];
    if (!firstRecord || !lastRecord) return null;

    return {
      startLine: firstRecord.lineIndex + 1,
      startColumn: firstRecord.columnOffset + 1,
      endLine: lastRecord.lineIndex + 1,
      endColumn: lastRecord.columnOffset + lastRecord.source.length + 1,
    };
  }

  const tokens = pointer.slice(1).split('/').map(decodeJsonPointerToken);
  const recordIndex = Number(tokens[0]);
  if (!Number.isInteger(recordIndex) || String(recordIndex) !== tokens[0]) return null;

  const record = jsonLines[recordIndex];
  if (!record) return null;

  let pointers = sourceMapCache.get(recordIndex);
  if (!pointers) {
    pointers = parseJsonSourceMap(record.source).pointers;
    sourceMapCache.set(recordIndex, pointers);
  }

  const linePointer = tokens.length === 1
    ? ''
    : `/${tokens.slice(1).map(encodeJsonPointerToken).join('/')}`;
  const lineRange = toHighlightRange(linePointer, pointers);
  return lineRange ? offsetLineRange(lineRange, record) : null;
};

const isJsonPathMatch = (value: unknown): value is JsonPathMatch => (
  Boolean(value) &&
  typeof value === 'object' &&
  'pointer' in value &&
  typeof (value as { pointer?: unknown }).pointer === 'string' &&
  'value' in value
);

/**
 * 查询 JSONPath 并返回可直接用于 Monaco 高亮的范围
 */
export const queryJsonPathRanges = (
  jsonData: string,
  query: string,
  options: JsonPathQueryOptions = {}
): JsonPathQueryResult => {
  const parsedSource = parseJsonPathSource(jsonData, options);
  const resultLimit = Math.max(1, options.resultLimit ?? DEFAULT_JSONPATH_RESULT_LIMIT);

  const matches: JsonPathMatch[] = [];
  let isLimited = false;
  try {
    JSONPath({
      path: query,
      json: parsedSource.parsedData,
      resultType: 'all',
      callback: (payload: unknown) => {
        if (matches.length >= resultLimit) {
          isLimited = true;
          throw new JsonPathResultLimitReached();
        }

        if (isJsonPathMatch(payload)) {
          matches.push(payload);
        }
      },
    });
  } catch (error) {
    if (error instanceof JsonPathResultLimitReached) {
      isLimited = true;
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`JSONPath 查询错误: ${message}`);
    }
  }

  if (!matches || matches.length === 0) {
    return {
      ranges: [],
      values: [],
      totalResults: 0,
      isLimited: false,
      resultLimit,
    };
  }

  const jsonLineSourceMapCache = new Map<number, JsonSourceMapPointers>();
  const results = matches
    .map(match => ({
      range: parsedSource.jsonLines
        ? toJsonLineHighlightRange(match.pointer, parsedSource.jsonLines, jsonLineSourceMapCache)
        : parsedSource.pointers ? toHighlightRange(match.pointer, parsedSource.pointers) : null,
      value: match.value,
    }))
    .filter((result): result is { range: HighlightRange; value: unknown } => result.range !== null);

  return {
    ranges: results.map(result => result.range),
    values: results.map(result => result.value),
    totalResults: matches.length,
    isLimited,
    resultLimit,
  };
};
