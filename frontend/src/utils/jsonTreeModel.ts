import type { JsonObject, JsonValue } from '../types';
import {
  getJsonPointerValue,
  stringifyJsonPointerValue,
} from './jsonPointer';
import {
  buildJsonTreeModel,
  compactJsonTreeText,
  parseJsonTreeSource,
} from './jsonTreeTraversal';
import { isJsonObject } from './jsonValueGuards';
import type {
  BuildJsonTreeModelOptions,
  JsonTreeModel,
  JsonTreeNode,
  JsonTreeNodeKind,
} from './jsonTreeTraversal';

export { buildJsonTreeModel, parseJsonTreeSource };
export type {
  BuildJsonTreeModelOptions,
  JsonTreeModel,
  JsonTreeNode,
  JsonTreeNodeKind,
};

export interface JsonTreeGraphNode {
  path: string;
  parentPath: string | null;
  keyLabel: string;
  kind: JsonTreeNodeKind;
  childCount: number;
  valuePreview: string;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface JsonTreeGraphEdge {
  id: string;
  fromPath: string;
  toPath: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface JsonTreeGraphView {
  nodes: JsonTreeGraphNode[];
  edges: JsonTreeGraphEdge[];
  width: number;
  height: number;
  totalCandidateNodes: number;
  isLimited: boolean;
  maxNodes: number;
  maxDepth: number;
}

export interface JsonTreeFocusTarget {
  path?: string;
  pointer?: string;
}

export interface BuildJsonTreeGraphViewOptions {
  maxNodes?: number;
  maxDepth?: number;
  columnWidth?: number;
  rowHeight?: number;
  nodeWidth?: number;
  nodeHeight?: number;
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

const DEFAULT_TABLE_PREVIEW_ROWS = 8;
const DEFAULT_TABLE_COLUMN_SCAN_ROWS = 200;
const DEFAULT_TABLE_PREVIEW_COLUMNS = 8;
const DEFAULT_TABLE_CELL_MAX_LENGTH = 80;
const DEFAULT_GRAPH_MAX_NODES = 90;
const DEFAULT_GRAPH_MAX_DEPTH = 6;
const DEFAULT_GRAPH_COLUMN_WIDTH = 168;
const DEFAULT_GRAPH_ROW_HEIGHT = 48;
const DEFAULT_GRAPH_NODE_WIDTH = 136;
const DEFAULT_GRAPH_NODE_HEIGHT = 32;
const GRAPH_PADDING_X = 24;
const GRAPH_PADDING_Y = 18;

const getTableCellText = (value: JsonValue, maxLength = Number.POSITIVE_INFINITY): string => {
  const text = typeof value === 'string'
    ? value
    : value === null
      ? 'null'
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

  return Number.isFinite(maxLength) ? compactJsonTreeText(text, maxLength) : text;
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
  Object.hasOwn(row, column)
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
  if (sampledItems.some(item => !isJsonObject(item))) return null;

  const objectRows = sampledItems.map((item, index) => ({
    index,
    sourceObject: item as JsonObject,
  }));
  const scannedItems = value.slice(0, maxScanRows);
  const sourceRows = scannedItems.reduce<JsonTreeArrayTableSourceRow[]>((result, item, index) => {
    if (isJsonObject(item)) {
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

export const buildJsonTreeGraphView = (
  nodes: JsonTreeNode[],
  options: BuildJsonTreeGraphViewOptions = {}
): JsonTreeGraphView => {
  const maxNodes = Math.max(1, options.maxNodes ?? DEFAULT_GRAPH_MAX_NODES);
  const maxDepth = Math.max(1, options.maxDepth ?? DEFAULT_GRAPH_MAX_DEPTH);
  const columnWidth = Math.max(96, options.columnWidth ?? DEFAULT_GRAPH_COLUMN_WIDTH);
  const rowHeight = Math.max(36, options.rowHeight ?? DEFAULT_GRAPH_ROW_HEIGHT);
  const nodeWidth = Math.max(80, options.nodeWidth ?? DEFAULT_GRAPH_NODE_WIDTH);
  const nodeHeight = Math.max(24, options.nodeHeight ?? DEFAULT_GRAPH_NODE_HEIGHT);
  const candidates = nodes.filter(node => node.depth <= maxDepth);
  const graphNodes = candidates.slice(0, maxNodes).map((node, index): JsonTreeGraphNode => ({
    path: node.path,
    parentPath: node.parentPath,
    keyLabel: node.keyLabel,
    kind: node.kind,
    childCount: node.childCount,
    valuePreview: node.valuePreview,
    depth: node.depth,
    x: GRAPH_PADDING_X + node.depth * columnWidth,
    y: GRAPH_PADDING_Y + index * rowHeight,
    width: nodeWidth,
    height: nodeHeight,
  }));
  const includedPaths = new Set(graphNodes.map(node => node.path));
  const edges = graphNodes
    .filter(node => node.parentPath && includedPaths.has(node.parentPath))
    .map((node): JsonTreeGraphEdge => {
      const parent = graphNodes.find(item => item.path === node.parentPath);
      return {
        id: `${node.parentPath}->${node.path}`,
        fromPath: node.parentPath || '',
        toPath: node.path,
        x1: parent ? parent.x + parent.width : node.x,
        y1: parent ? parent.y + parent.height / 2 : node.y + node.height / 2,
        x2: node.x,
        y2: node.y + node.height / 2,
      };
    });
  const maxGraphDepth = graphNodes.reduce((max, node) => Math.max(max, node.depth), 0);
  const width = Math.max(320, GRAPH_PADDING_X * 2 + maxGraphDepth * columnWidth + nodeWidth);
  const height = Math.max(220, GRAPH_PADDING_Y * 2 + Math.max(graphNodes.length, 1) * rowHeight);

  return {
    nodes: graphNodes,
    edges,
    width,
    height,
    totalCandidateNodes: candidates.length,
    isLimited: candidates.length > graphNodes.length,
    maxNodes,
    maxDepth,
  };
};
