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

export interface JsonTreeFocusTarget {
  path?: string;
  pointer?: string;
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
  sourceObject: JsonObject;
}

export interface JsonTreeArrayTableSourceRow {
  index: number;
  sourceObject: JsonObject;
}

export interface JsonTreeArrayTablePreview {
  columns: string[];
  allColumns: string[];
  rows: JsonTreeArrayTablePreviewRow[];
  sourceRows: JsonTreeArrayTableSourceRow[];
  totalRows: number;
  sampledRows: number;
  scannedRows: number;
  totalColumns: number;
  maxRows: number;
  maxScanRows: number;
  maxColumns: number;
  maxCellLength: number;
  isRowLimited: boolean;
  isScanLimited: boolean;
  isColumnLimited: boolean;
  isRowResampled: boolean;
}

interface BuildJsonTreeArrayTablePreviewOptions {
  maxRows?: number;
  maxScanRows?: number;
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
const DEFAULT_TABLE_COLUMN_SCAN_ROWS = 200;
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

const escapeMarkdownTableCell = (value: string): string => (
  value
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim()
);

const hasOwnJsonColumn = (row: JsonObject, column: string): boolean => (
  Object.prototype.hasOwnProperty.call(row, column)
);

const getJsonTableColumns = (rows: JsonTreeArrayTableSourceRow[]): string[] => (
  [...new Set(rows.flatMap(row => Object.keys(row.sourceObject)))]
);

const buildJsonTreeArrayTableRows = (
  sourceRows: JsonTreeArrayTableSourceRow[],
  columns: string[],
  maxCellLength: number
): JsonTreeArrayTablePreviewRow[] => (
  sourceRows.map(row => ({
    index: row.index,
    cells: columns.map(column => (
      hasOwnJsonColumn(row.sourceObject, column)
        ? getTableCellText(row.sourceObject[column], maxCellLength)
        : ''
    )),
    copyCells: columns.map(column => (
      hasOwnJsonColumn(row.sourceObject, column)
        ? getTableCellText(row.sourceObject[column])
        : ''
    )),
    jsonObject: columns.reduce<JsonObject>((result, column) => {
      if (hasOwnJsonColumn(row.sourceObject, column)) {
        result[column] = row.sourceObject[column];
      }
      return result;
    }, {}),
    sourceObject: row.sourceObject,
  }))
);

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

export const resolveJsonTreeFocusTarget = (
  nodes: JsonTreeNode[],
  target: JsonTreeFocusTarget
): JsonTreeNode | null => {
  const pointer = target.pointer;
  if (pointer !== undefined) {
    const pointerNode = nodes.find(node => node.jsonPointer === pointer);
    if (pointerNode) return pointerNode;
  }

  const path = target.path?.trim();
  if (!path) return null;

  return nodes.find(node => node.path === path) || null;
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

export const formatJsonTreeSearchResultsMarkdownText = (
  nodes: JsonTreeNode[]
): string => {
  const lines = [
    '| Path | Pointer | Kind | Children | Preview |',
    '| --- | --- | --- | ---: | --- |',
  ];

  nodes.forEach(node => {
    lines.push([
      node.path,
      node.jsonPointer || '(root)',
      node.kind,
      String(node.childCount),
      node.valuePreview,
    ].map(escapeMarkdownTableCell).join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  });

  return lines.join('\n');
};

export const formatJsonTreeSearchResultsCsvText = (
  nodes: JsonTreeNode[]
): string => (
  [
    ['path', 'pointer', 'kind', 'childCount', 'preview'].map(escapeCsvCell).join(','),
    ...nodes.map(node => [
      node.path,
      node.jsonPointer,
      node.kind,
      String(node.childCount),
      node.valuePreview,
    ].map(escapeCsvCell).join(',')),
  ].join('\n')
);

export const buildJsonTreeArrayTablePreview = (
  jsonText: string,
  jsonPointer: string,
  options: BuildJsonTreeArrayTablePreviewOptions = {}
): JsonTreeArrayTablePreview | null => {
  const value = getJsonTreeNodeValue(jsonText, jsonPointer);
  if (!Array.isArray(value) || value.length === 0) return null;

  const maxRows = Math.max(1, options.maxRows ?? DEFAULT_TABLE_PREVIEW_ROWS);
  const maxScanRows = Math.max(maxRows, options.maxScanRows ?? DEFAULT_TABLE_COLUMN_SCAN_ROWS);
  const maxColumns = Math.max(1, options.maxColumns ?? DEFAULT_TABLE_PREVIEW_COLUMNS);
  const maxCellLength = Math.max(16, options.maxCellLength ?? DEFAULT_TABLE_CELL_MAX_LENGTH);
  const sampledItems = value.slice(0, maxRows);
  if (sampledItems.some(item => !isJsonRecord(item))) return null;

  const objectRows = sampledItems.map((item, index) => ({
    index,
    sourceObject: item as JsonObject,
  }));
  const scannedItems = value.slice(0, maxScanRows);
  const sourceRows = scannedItems.reduce<JsonTreeArrayTableSourceRow[]>((result, item, index) => {
    if (isJsonRecord(item)) {
      result.push({ index, sourceObject: item as JsonObject });
    }
    return result;
  }, []);

  const defaultColumns = getJsonTableColumns(objectRows);
  const allColumns = getJsonTableColumns(sourceRows);
  if (allColumns.length === 0) return null;

  const columns = defaultColumns.slice(0, maxColumns);
  const rows = buildJsonTreeArrayTableRows(objectRows, columns, maxCellLength);

  return {
    columns,
    allColumns,
    rows,
    sourceRows,
    totalRows: value.length,
    sampledRows: objectRows.length,
    scannedRows: sourceRows.length,
    totalColumns: allColumns.length,
    maxRows,
    maxScanRows,
    maxColumns,
    maxCellLength,
    isRowLimited: value.length > sampledItems.length,
    isScanLimited: value.length > scannedItems.length,
    isColumnLimited: defaultColumns.length > columns.length || allColumns.length > defaultColumns.length,
    isRowResampled: false,
  };
};

export const formatJsonTreeArrayTableJsonText = (
  preview: JsonTreeArrayTablePreview
): string => (
  JSON.stringify(preview.rows.map(row => row.jsonObject), null, 2)
);

export const filterJsonTreeArrayTablePreviewColumns = (
  preview: JsonTreeArrayTablePreview,
  query: string
): JsonTreeArrayTablePreview => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return preview;

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const sourceColumns = preview.allColumns || preview.columns;
  const matchedColumnEntries = sourceColumns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => {
      const normalizedColumn = column.toLowerCase();
      return tokens.every(token => normalizedColumn.includes(token));
    });
  const columnEntries = matchedColumnEntries.slice(0, Math.max(1, preview.maxColumns || preview.columns.length || 1));

  const columns = columnEntries.map(entry => entry.column);
  const hasMatchedColumnInCurrentRows = columns.length === 0 || preview.rows.some(row => (
    columns.some(column => hasOwnJsonColumn(row.sourceObject, column))
  ));
  const maxRows = Math.max(1, preview.maxRows || preview.rows.length || 1);
  const candidateSourceRows = preview.sourceRows || preview.rows.map(row => ({
    index: row.index,
    sourceObject: row.sourceObject,
  }));
  const filteredSourceRows = hasMatchedColumnInCurrentRows
    ? preview.rows.map(row => ({
      index: row.index,
      sourceObject: row.sourceObject,
    }))
    : candidateSourceRows
      .filter(row => columns.some(column => hasOwnJsonColumn(row.sourceObject, column)))
      .slice(0, maxRows);

  return {
    ...preview,
    columns,
    rows: buildJsonTreeArrayTableRows(
      filteredSourceRows,
      columns,
      preview.maxCellLength || DEFAULT_TABLE_CELL_MAX_LENGTH
    ),
    sampledRows: filteredSourceRows.length,
    isColumnLimited: preview.isColumnLimited || matchedColumnEntries.length > columns.length,
    isRowResampled: !hasMatchedColumnInCurrentRows,
  };
};

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
