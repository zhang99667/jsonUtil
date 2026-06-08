import type { JsonValue } from '../types';

const JSON_LINE_PREFIX_RE = /^[{\["tfn\-\d]/;

export interface JsonLineRecord {
  value: JsonValue;
  source: string;
  lineIndex: number;
  columnOffset: number;
}

export interface JsonLinesDiagnostic {
  records: JsonLineRecord[] | null;
  error?: string;
}

/**
 * 解析一行一个 JSON 的 JSON Lines 内容，并保留原始行位置用于高亮回填。
 */
export const parseJsonLinesDetailed = (input: string): JsonLinesDiagnostic => {
  if (!input.includes('\n')) return { records: null };

  const records: JsonLineRecord[] = [];
  const lines = input.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!JSON_LINE_PREFIX_RE.test(trimmed)) return { records: null };

    try {
      records.push({
        value: JSON.parse(trimmed) as JsonValue,
        source: trimmed,
        lineIndex,
        columnOffset: line.search(/\S/),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        records: null,
        error: `JSON Lines 第 ${lineIndex + 1} 行解析错误: ${message}`,
      };
    }
  }

  return { records: records.length >= 2 ? records : null };
};

export const parseJsonLinesWithMetadata = (input: string): JsonLineRecord[] | null => {
  return parseJsonLinesDetailed(input).records;
};

export const parseJsonLines = (input: string): JsonValue[] | null => {
  const records = parseJsonLinesWithMetadata(input);
  return records ? records.map(record => record.value) : null;
};

export const stringifyJsonLines = (records: JsonValue[]): string => (
  records.map(record => JSON.stringify(record)).join('\n')
);
