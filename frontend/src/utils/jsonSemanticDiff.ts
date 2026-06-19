import type { JsonObject, JsonValue } from '../types';
import { parseJsonLines } from './jsonLines';

export type JsonSemanticDiffKind = 'added' | 'removed' | 'changed';

export interface JsonSemanticDiffItem {
  kind: JsonSemanticDiffKind;
  path: string;
  before?: JsonValue;
  after?: JsonValue;
  beforePreview?: string;
  afterPreview?: string;
}

export interface JsonSemanticDiffResult {
  items: JsonSemanticDiffItem[];
  added: number;
  removed: number;
  changed: number;
  total: number;
  isLimited: boolean;
  maxDiffs: number;
}

export interface CompareJsonSemanticOptions {
  maxDiffs?: number;
}

const DEFAULT_MAX_DIFFS = 500;
const PREVIEW_MAX_LENGTH = 120;

const isJsonRecord = (value: JsonValue): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const appendJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const appendJsonPathIndex = (path: string, index: number): string => `${path}[${index}]`;

const getValuePreview = (value: JsonValue | undefined): string | undefined => {
  if (value === undefined) return undefined;

  const text = JSON.stringify(value);
  if (text === undefined) return String(value);
  return text.length <= PREVIEW_MAX_LENGTH
    ? text
    : `${text.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
};

export const parseJsonForSemanticDiff = (source: string): JsonValue => {
  try {
    return JSON.parse(source) as JsonValue;
  } catch (error) {
    const jsonLines = parseJsonLines(source);
    if (jsonLines) return jsonLines;

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`JSON 解析失败: ${message}`);
  }
};

const areSamePrimitiveValue = (left: JsonValue, right: JsonValue): boolean => (
  left === right
);

export const compareJsonSemanticValues = (
  before: JsonValue,
  after: JsonValue,
  options: CompareJsonSemanticOptions = {}
): JsonSemanticDiffResult => {
  const maxDiffs = Math.max(1, options.maxDiffs ?? DEFAULT_MAX_DIFFS);
  const items: JsonSemanticDiffItem[] = [];
  let added = 0;
  let removed = 0;
  let changed = 0;
  let isLimited = false;

  const pushDiff = (
    kind: JsonSemanticDiffKind,
    path: string,
    beforeValue?: JsonValue,
    afterValue?: JsonValue
  ) => {
    if (items.length >= maxDiffs) {
      isLimited = true;
      return;
    }

    if (kind === 'added') added += 1;
    if (kind === 'removed') removed += 1;
    if (kind === 'changed') changed += 1;

    items.push({
      kind,
      path,
      before: beforeValue,
      after: afterValue,
      beforePreview: getValuePreview(beforeValue),
      afterPreview: getValuePreview(afterValue),
    });
  };

  // 深度优先对比，保留稳定路径，方便复制给接口维护者。
  const visit = (left: JsonValue, right: JsonValue, path: string) => {
    if (isLimited) return;

    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right)) {
        pushDiff('changed', path, left, right);
        return;
      }

      const maxLength = Math.max(left.length, right.length);
      for (let index = 0; index < maxLength; index += 1) {
        if (isLimited) return;
        const childPath = appendJsonPathIndex(path, index);
        if (index >= left.length) {
          pushDiff('added', childPath, undefined, right[index]);
        } else if (index >= right.length) {
          pushDiff('removed', childPath, left[index], undefined);
        } else {
          visit(left[index] as JsonValue, right[index] as JsonValue, childPath);
        }
      }
      return;
    }

    if (isJsonRecord(left) || isJsonRecord(right)) {
      if (!isJsonRecord(left) || !isJsonRecord(right)) {
        pushDiff('changed', path, left, right);
        return;
      }

      const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
      for (const key of keys) {
        if (isLimited) return;
        const childPath = appendJsonPathKey(path, key);
        const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
        const hasRight = Object.prototype.hasOwnProperty.call(right, key);
        if (!hasLeft) {
          pushDiff('added', childPath, undefined, right[key]);
        } else if (!hasRight) {
          pushDiff('removed', childPath, left[key], undefined);
        } else {
          visit(left[key], right[key], childPath);
        }
      }
      return;
    }

    if (!areSamePrimitiveValue(left, right)) {
      pushDiff('changed', path, left, right);
    }
  };

  visit(before, after, '$');

  return {
    items,
    added,
    removed,
    changed,
    total: items.length,
    isLimited,
    maxDiffs,
  };
};

const DIFF_KIND_LABELS: Record<JsonSemanticDiffKind, string> = {
  added: '新增',
  removed: '删除',
  changed: '修改',
};

export const formatJsonSemanticDiffMarkdown = (result: JsonSemanticDiffResult): string => {
  if (result.total === 0) {
    return [
      '# JSON 对比报告',
      '',
      '两份 JSON 语义一致。',
    ].join('\n');
  }

  const rows = result.items.map(item => {
    const beforeText = item.beforePreview ?? '';
    const afterText = item.afterPreview ?? '';
    return `| ${DIFF_KIND_LABELS[item.kind]} | \`${item.path}\` | \`${beforeText.replace(/\|/g, '\\|')}\` | \`${afterText.replace(/\|/g, '\\|')}\` |`;
  });

  return [
    '# JSON 对比报告',
    '',
    `汇总: 新增 ${result.added} / 删除 ${result.removed} / 修改 ${result.changed}${result.isLimited ? `（已截断前 ${result.maxDiffs} 条）` : ''}`,
    '',
    '| 类型 | 路径 | SOURCE | 对比值 |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
};

export const compareJsonSemanticText = (
  beforeText: string,
  afterText: string,
  options: CompareJsonSemanticOptions = {}
): JsonSemanticDiffResult => (
  compareJsonSemanticValues(
    parseJsonForSemanticDiff(beforeText),
    parseJsonForSemanticDiff(afterText),
    options
  )
);
