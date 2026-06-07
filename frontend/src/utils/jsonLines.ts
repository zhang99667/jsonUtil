import type { JsonValue } from '../types';

const JSON_LINE_PREFIX_RE = /^[{\["tfn\-\d]/;

export interface JsonLineRecord {
  value: JsonValue;
  source: string;
  lineIndex: number;
  columnOffset: number;
}

/**
 * 解析一行一个 JSON 的 JSON Lines 内容，并保留原始行位置用于高亮回填。
 */
export const parseJsonLinesWithMetadata = (input: string): JsonLineRecord[] | null => {
  if (!input.includes('\n')) return null;

  const records: JsonLineRecord[] = [];
  const lines = input.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!JSON_LINE_PREFIX_RE.test(trimmed)) return null;

    try {
      records.push({
        value: JSON.parse(trimmed) as JsonValue,
        source: trimmed,
        lineIndex,
        columnOffset: line.search(/\S/),
      });
    } catch {
      return null;
    }
  }

  return records.length >= 2 ? records : null;
};

export const parseJsonLines = (input: string): JsonValue[] | null => {
  const records = parseJsonLinesWithMetadata(input);
  return records ? records.map(record => record.value) : null;
};

export const stringifyJsonLines = (records: JsonValue[]): string => (
  records.map(record => JSON.stringify(record)).join('\n')
);
