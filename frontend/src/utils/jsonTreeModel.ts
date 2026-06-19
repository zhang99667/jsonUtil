import type { JsonValue } from '../types';
import { parseJsonLinesWithMetadata } from './jsonLines';

export type JsonTreeNodeKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonTreeNode {
  id: string;
  path: string;
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

interface PendingTreeNode {
  value: JsonValue;
  path: string;
  parentPath: string | null;
  ancestorPaths: string[];
  keyLabel: string;
  depth: number;
}

const DEFAULT_MAX_TREE_NODES = 1500;
const DEFAULT_MAX_TREE_DEPTH = 24;
const DEFAULT_PREVIEW_MAX_LENGTH = 80;

const isJsonRecord = (value: JsonValue): value is Record<string, JsonValue> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const appendJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
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

const getValuePreview = (value: JsonValue, maxLength: number): string => {
  if (Array.isArray(value)) return `数组 ${value.length} 项`;
  if (isJsonRecord(value)) return `对象 ${Object.keys(value).length} 个键`;
  if (typeof value === 'string') return compactText(JSON.stringify(value), maxLength);
  if (value === null) return 'null';
  return String(value);
};

const parseTreeSource = (source: string): JsonValue => {
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
      parentPath: node.path,
      ancestorPaths: [...node.ancestorPaths, node.path],
      keyLabel: key,
      depth: node.depth + 1,
    }));
  }

  return [];
};

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
  const rootValue = parseTreeSource(source);
  const nodes: JsonTreeNode[] = [];
  const stack: PendingTreeNode[] = [{
    value: rootValue,
    path: '$',
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
