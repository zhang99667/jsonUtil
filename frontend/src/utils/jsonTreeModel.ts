import type { JsonObject, JsonValue } from '../types';
import {
  encodeJsonPointerSegment,
  getJsonPointerValue,
  stringifyJsonPointerValue,
} from './jsonPointer';
import { parseJsonLinesWithMetadata } from './jsonLines';

export type JsonTreeNodeKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonTreeNode {
  id: string;
  path: string;
  jsonPointer: string;
  parentPath: string | null;
  ancestorPaths: string[];
  keyLabel: string;
  depth: number;
  kind: JsonTreeNodeKind;
  childCount: number;
  isContainer: boolean;
  valuePreview: string;
  searchText: string;
}

export interface JsonTreeModel {
  nodes: JsonTreeNode[];
  totalNodes: number;
  isLimited: boolean;
  maxNodes: number;
  maxDepth: number;
}

export interface BuildJsonTreeModelOptions {
  maxNodes?: number;
  maxDepth?: number;
  previewMaxLength?: number;
}

export interface JsonTreeArrayTablePreviewRow {
  index: number;
  cells: string[];
  copyCells: string[];
  jsonObject: JsonObject;
}

export interface JsonTreeArrayTablePreview {
  columns: string[];
  rows: JsonTreeArrayTablePreviewRow[];
  totalRows: number;
  sampledRows: number;
  totalColumns: number;
  isRowLimited: boolean;
  isColumnLimited: boolean;
}

interface BuildJsonTreeArrayTablePreviewOptions {
  maxRows?: number;
  maxColumns?: number;
  maxCellLength?: number;
}

interface PendingTreeNode {
  value: JsonValue;
  path: string;
  jsonPointer: string;
  parentPath: string | null;
  ancestorPaths: string[];
  keyLabel: string;
  depth: number;
}

const DEFAULT_MAX_TREE_NODES = 1500;
const DEFAULT_MAX_TREE_DEPTH = 24;
const DEFAULT_PREVIEW_MAX_LENGTH = 80;
const DEFAULT_TABLE_PREVIEW_ROWS = 8;
const DEFAULT_TABLE_PREVIEW_COLUMNS = 8;
const DEFAULT_TABLE_CELL_MAX_LENGTH = 80;

const isJsonRecord = (value: JsonValue): value is Record<string, JsonValue> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const appendJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const appendJsonPointerSegment = (pointer: string, segment: string): string => (
  `${pointer}/${encodeJsonPointerSegment(segment)}`
);

const getNodeKind = (value: JsonValue): JsonTreeNodeKind => {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  return 'boolean';
};

const getChildCount = (value: JsonValue): number => {
  if (Array.isArray(value)) return value.length;
  if (isJsonRecord(value)) return Object.keys(value).length;
  return 0;
};

const compactText = (value: string, maxLength: number): string => {
  const compacted = value.replace(/\s+/g, ' ').trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, Math.max(0, maxLength - 3))}...`;
};

const getTableCellText = (value: JsonValue, maxLength = Number.POSITIVE_INFINITY): string => {
  const text = typeof value === 'string'
    ? value
    : value === null
      ? 'null'
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

  return Number.isFinite(maxLength) ? compactText(text, maxLength) : text;
};

const escapeCsvCell = (value: string): string => {
  if (!/[",\n\r]/.test(value) && value.trim() === value) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

const normalizeSearchToken = (value: string): string => value.trim().toLowerCase();

const isFuzzyTokenMatch = (text: string, token: string): boolean => {
  if (!token) return true;

  let tokenIndex = 0;
  for (let textIndex = 0; textIndex < text.length && tokenIndex < token.length; textIndex++) {
    if (text[textIndex] === token[tokenIndex]) {
      tokenIndex++;
    }
  }

  return tokenIndex === token.length;
};

/**
 * 结构导航搜索支持多关键词和字符顺序模糊匹配，方便在大 JSON 中快速定位路径。
 */
export const matchesJsonTreeSearchText = (searchText: string, query: string): boolean => {
  const normalizedText = normalizeSearchToken(searchText);
  const tokens = query
    .split(/\s+/)
    .map(normalizeSearchToken)
    .filter(Boolean);

  if (tokens.length === 0) return true;

  return tokens.every(token => (
    normalizedText.includes(token) || isFuzzyTokenMatch(normalizedText, token)
  ));
};

const getValuePreview = (value: JsonValue, maxLength: number): string => {
  if (Array.isArray(value)) return `数组 ${value.length} 项`;
  if (isJsonRecord(value)) return `对象 ${Object.keys(value).length} 个键`;
  if (typeof value === 'string') return compactText(JSON.stringify(value), maxLength);
  if (value === null) return 'null';
  return String(value);
};

export const parseJsonTreeSource = (source: string): JsonValue => {
  try {
    return JSON.parse(source) as JsonValue;
  } catch (error) {
    const jsonLines = parseJsonLinesWithMetadata(source);
    if (jsonLines) {
      return jsonLines.map(record => record.value) as JsonValue;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`JSON 结构解析失败: ${message}`);
  }
};

const getChildren = (node: PendingTreeNode): PendingTreeNode[] => {
  if (Array.isArray(node.value)) {
    return node.value.map((value, index) => ({
      value,
      path: `${node.path}[${index}]`,
      jsonPointer: appendJsonPointerSegment(node.jsonPointer, String(index)),
      parentPath: node.path,
      ancestorPaths: [...node.ancestorPaths, node.path],
      keyLabel: `[${index}]`,
      depth: node.depth + 1,
    }));
  }

  if (isJsonRecord(node.value)) {
    return Object.keys(node.value).map(key => ({
      value: node.value[key],
      path: appendJsonPathKey(node.path, key),
      jsonPointer: appendJsonPointerSegment(node.jsonPointer, key),
      parentPath: node.path,
      ancestorPaths: [...node.ancestorPaths, node.path],
      keyLabel: key,
      depth: node.depth + 1,
    }));
  }

  return [];
};

export const getJsonTreeNodeValue = (jsonText: string, jsonPointer: string): JsonValue => (
  getJsonPointerValue(parseJsonTreeSource(jsonText.trim()), jsonPointer) as JsonValue
);

export const getJsonTreeNodeValueCopyText = (
  jsonText: string,
  jsonPointer: string,
  options: { pretty?: boolean } = {}
): string => (
  stringifyJsonPointerValue(parseJsonTreeSource(jsonText.trim()), jsonPointer, options)
);

export const formatJsonTreeSearchResultsText = (
  nodes: JsonTreeNode[]
): string => (
  JSON.stringify(nodes.map(node => ({
    path: node.path,
    pointer: node.jsonPointer,
    kind: node.kind,
    childCount: node.childCount,
    preview: node.valuePreview,
  })), null, 2)
);

export const buildJsonTreeArrayTablePreview = (
  jsonText: string,
  jsonPointer: string,
  options: BuildJsonTreeArrayTablePreviewOptions = {}
): JsonTreeArrayTablePreview | null => {
  const value = getJsonTreeNodeValue(jsonText, jsonPointer);
  if (!Array.isArray(value) || value.length === 0) return null;

  const maxRows = Math.max(1, options.maxRows ?? DEFAULT_TABLE_PREVIEW_ROWS);
  const maxColumns = Math.max(1, options.maxColumns ?? DEFAULT_TABLE_PREVIEW_COLUMNS);
  const maxCellLength = Math.max(16, options.maxCellLength ?? DEFAULT_TABLE_CELL_MAX_LENGTH);
  const sampledItems = value.slice(0, maxRows);
  if (sampledItems.some(item => !isJsonRecord(item))) return null;

  const objectRows = sampledItems.map((item, index) => ({ item: item as JsonObject, index }));

  const allColumns = [...new Set(objectRows.flatMap(row => Object.keys(row.item)))];
  if (allColumns.length === 0) return null;

  const columns = allColumns.slice(0, maxColumns);
  const rows = objectRows.map(row => ({
    index: row.index,
    cells: columns.map(column => (
      Object.prototype.hasOwnProperty.call(row.item, column)
        ? getTableCellText(row.item[column], maxCellLength)
        : ''
    )),
    copyCells: columns.map(column => (
      Object.prototype.hasOwnProperty.call(row.item, column)
        ? getTableCellText(row.item[column])
        : ''
    )),
    jsonObject: columns.reduce<JsonObject>((result, column) => {
      if (Object.prototype.hasOwnProperty.call(row.item, column)) {
        result[column] = row.item[column];
      }
      return result;
    }, {}),
  }));

  return {
    columns,
    rows,
    totalRows: value.length,
    sampledRows: objectRows.length,
    totalColumns: allColumns.length,
    isRowLimited: value.length > sampledItems.length,
    isColumnLimited: allColumns.length > columns.length,
  };
};

export const formatJsonTreeArrayTableJsonText = (
  preview: JsonTreeArrayTablePreview
): string => (
  JSON.stringify(preview.rows.map(row => row.jsonObject), null, 2)
);

export const formatJsonTreeArrayTableCsvText = (
  preview: JsonTreeArrayTablePreview
): string => (
  [
    preview.columns.map(escapeCsvCell).join(','),
    ...preview.rows.map(row => row.copyCells.map(escapeCsvCell).join(',')),
  ].join('\n')
);

export const buildJsonTreeModel = (
  jsonText: string,
  options: BuildJsonTreeModelOptions = {}
): JsonTreeModel => {
  const source = jsonText.trim();
  if (!source) {
    return {
      nodes: [],
      totalNodes: 0,
      isLimited: false,
      maxNodes: options.maxNodes ?? DEFAULT_MAX_TREE_NODES,
      maxDepth: options.maxDepth ?? DEFAULT_MAX_TREE_DEPTH,
    };
  }

  const maxNodes = Math.max(1, options.maxNodes ?? DEFAULT_MAX_TREE_NODES);
  const maxDepth = Math.max(1, options.maxDepth ?? DEFAULT_MAX_TREE_DEPTH);
  const previewMaxLength = Math.max(16, options.previewMaxLength ?? DEFAULT_PREVIEW_MAX_LENGTH);
  const rootValue = parseJsonTreeSource(source);
  const nodes: JsonTreeNode[] = [];
  const stack: PendingTreeNode[] = [{
    value: rootValue,
    path: '$',
    jsonPointer: '',
    parentPath: null,
    ancestorPaths: [],
    keyLabel: '$',
    depth: 0,
  }];
  let isLimited = false;

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;

    if (nodes.length >= maxNodes) {
      isLimited = true;
      break;
    }

    const kind = getNodeKind(current.value);
    const childCount = getChildCount(current.value);
    const valuePreview = getValuePreview(current.value, previewMaxLength);
    const isContainer = childCount > 0;

    nodes.push({
      id: current.path,
      path: current.path,
      jsonPointer: current.jsonPointer,
      parentPath: current.parentPath,
      ancestorPaths: current.ancestorPaths,
      keyLabel: current.keyLabel,
      depth: current.depth,
      kind,
      childCount,
      isContainer,
      valuePreview,
      searchText: `${current.path} ${current.keyLabel} ${kind} ${valuePreview}`.toLowerCase(),
    });

    if (!isContainer) continue;
    if (current.depth >= maxDepth) {
      isLimited = true;
      continue;
    }

    const children = getChildren(current);
    for (let index = children.length - 1; index >= 0; index--) {
      const child = children[index];
      if (child) stack.push(child);
    }
  }

  return {
    nodes,
    totalNodes: nodes.length,
    isLimited,
    maxNodes,
    maxDepth,
  };
};
