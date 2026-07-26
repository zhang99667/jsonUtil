import type { JsonValue } from '../types';
import { formatUnknownError } from './errors';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { parseJsonLines } from './jsonLines';
import { appendJsonPointerSegment } from './jsonPointer';
import { formatJsonValuePreview } from './transformValuePreview';
import { isJsonObject, parseJsonValue } from './jsonValueGuards';

export type JsonSemanticDiffKind = 'added' | 'removed' | 'changed';

export interface JsonSemanticDiffItem {
  kind: JsonSemanticDiffKind;
  path: string;
  pointer: string;
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
  ignoredPaths: string[];
}

export interface CompareJsonSemanticOptions {
  maxDiffs?: number;
  ignoredPaths?: string[];
}

interface JsonSemanticDiffTask {
  before: JsonValue | undefined;
  after: JsonValue | undefined;
  path: string;
  pointer: string;
}

const DEFAULT_MAX_DIFFS = 500;
const PREVIEW_MAX_LENGTH = 120;

const getValuePreview = (value: JsonValue | undefined): string | undefined => {
  if (value === undefined) return undefined;

  const text = value !== null && typeof value === 'object'
    ? formatJsonValuePreview(value, PREVIEW_MAX_LENGTH)
    : JSON.stringify(value);
  if (text === undefined) return String(value);
  return text.length <= PREVIEW_MAX_LENGTH
    ? text
    : `${text.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
};

const normalizeIgnoredPath = (path: string): string => {
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed === '$' || trimmed.startsWith('$')) return trimmed;
  if (trimmed.startsWith('[')) return `$${trimmed}`;
  return `$.${trimmed}`;
};

export const parseJsonSemanticDiffIgnoredPaths = (text: string): string[] => (
  [...new Set(
    text
      .split(/[\n,;]+/)
      .map(normalizeIgnoredPath)
      .filter(Boolean)
  )]
);

const isIgnoredDiffPath = (path: string, ignoredPaths: string[]): boolean => (
  ignoredPaths.some(ignoredPath => (
    path === ignoredPath ||
    path.startsWith(`${ignoredPath}.`) ||
    path.startsWith(`${ignoredPath}[`)
  ))
);

export const parseJsonForSemanticDiff = (source: string): JsonValue => {
  try {
    return parseJsonValue(source);
  } catch (error) {
    const jsonLines = parseJsonLines(source);
    if (jsonLines) return jsonLines;

    const message = formatUnknownError(error);
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
  const ignoredPaths = (options.ignoredPaths || [])
    .map(normalizeIgnoredPath)
    .filter(Boolean);
  const items: JsonSemanticDiffItem[] = [];
  let added = 0;
  let removed = 0;
  let changed = 0;
  let isLimited = false;

  const pushDiff = (
    kind: JsonSemanticDiffKind,
    path: string,
    pointer: string,
    beforeValue?: JsonValue,
    afterValue?: JsonValue
  ) => {
    if (isIgnoredDiffPath(path, ignoredPaths)) return;

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
      pointer,
      before: beforeValue,
      after: afterValue,
      beforePreview: getValuePreview(beforeValue),
      afterPreview: getValuePreview(afterValue),
    });
  };

  const pending: JsonSemanticDiffTask[] = [{
    before,
    after,
    path: '$',
    pointer: '',
  }];

  // 倒序入栈保持原有深度优先顺序，同时避开深层 JSON 的调用栈上限。
  while (pending.length > 0 && !isLimited) {
    const task = pending.pop();
    if (!task || isIgnoredDiffPath(task.path, ignoredPaths)) continue;

    if (task.before === undefined || task.after === undefined) {
      if (task.before === undefined && task.after === undefined) continue;
      pushDiff(
        task.before === undefined ? 'added' : 'removed',
        task.path,
        task.pointer,
        task.before,
        task.after
      );
      continue;
    }

    const { before: left, after: right, path, pointer } = task;

    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right)) {
        pushDiff('changed', path, pointer, left, right);
        continue;
      }

      const maxLength = Math.max(left.length, right.length);
      for (let index = maxLength - 1; index >= 0; index -= 1) {
        const childPath = appendJsonPathIndex(path, index);
        const childPointer = appendJsonPointerSegment(pointer, String(index));
        pending.push({
          before: left[index],
          after: right[index],
          path: childPath,
          pointer: childPointer,
        });
      }
      continue;
    }

    if (isJsonObject(left) || isJsonObject(right)) {
      if (!isJsonObject(left) || !isJsonObject(right)) {
        pushDiff('changed', path, pointer, left, right);
        continue;
      }

      const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
      for (let index = keys.length - 1; index >= 0; index -= 1) {
        const key = keys[index];
        const childPath = appendJsonPathKey(path, key);
        const childPointer = appendJsonPointerSegment(pointer, key);
        pending.push({
          before: Object.hasOwn(left, key) ? left[key] : undefined,
          after: Object.hasOwn(right, key) ? right[key] : undefined,
          path: childPath,
          pointer: childPointer,
        });
      }
      continue;
    }

    if (!areSamePrimitiveValue(left, right)) {
      pushDiff('changed', path, pointer, left, right);
    }
  }

  return {
    items,
    added,
    removed,
    changed,
    total: items.length,
    isLimited,
    maxDiffs,
    ignoredPaths,
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
      result.ignoredPaths.length > 0
        ? `两份 JSON 在忽略 ${result.ignoredPaths.length} 条路径后语义一致。`
        : '两份 JSON 语义一致。',
      ...(result.ignoredPaths.length > 0 ? ['', `忽略路径: ${result.ignoredPaths.map(path => `\`${path}\``).join('、')}`] : []),
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
    ...(result.ignoredPaths.length > 0 ? ['', `忽略路径: ${result.ignoredPaths.map(path => `\`${path}\``).join('、')}`] : []),
    '',
    '| 类型 | 路径 | 原始值 | 对比值 |',
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
