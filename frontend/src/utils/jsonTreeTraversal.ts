import type { JsonValue } from '../types';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { appendJsonPointerSegment } from './jsonPointer';
import { parseJsonLinesWithMetadata } from './jsonLines';
import { formatUnknownError } from './errors';
import { isJsonObject } from './jsonValueGuards';

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

interface PendingTreeNode {
  value: JsonValue;
  path: string;
  jsonPointer: string;
  parentPath: string | null;
  ancestorPaths: string[];
  keyLabel: string;
  depth: number;
}

interface PendingTreeNodeFrame {
  type: 'node';
  node: PendingTreeNode;
}

interface PendingTreeChildrenFrame {
  type: 'children';
  parent: PendingTreeNode;
  childCount: number;
  objectKeyIterator: Iterator<string> | null;
  nextIndex: number;
}

type PendingTreeFrame = PendingTreeNodeFrame | PendingTreeChildrenFrame;

const DEFAULT_MAX_TREE_NODES = 1500;
const DEFAULT_MAX_TREE_DEPTH = 24;
const DEFAULT_PREVIEW_MAX_LENGTH = 80;

const iterateObjectKeys = function* (value: Record<string, JsonValue>): Generator<string> {
  for (const key in value) {
    if (Object.hasOwn(value, key)) yield key;
  }
};

const countObjectKeys = (value: Record<string, JsonValue>): number => {
  let count = 0;
  for (const _key of iterateObjectKeys(value)) count += 1;
  return count;
};

const getNodeKind = (value: JsonValue): JsonTreeNodeKind => {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  return 'boolean';
};

export const compactJsonTreeText = (value: string, maxLength: number): string => {
  const compacted = value.replace(/\s+/g, ' ').trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, Math.max(0, maxLength - 3))}...`;
};

const getValuePreview = (value: JsonValue, childCount: number, maxLength: number): string => {
  if (Array.isArray(value)) return `数组 ${childCount} 项`;
  if (isJsonObject(value)) return `对象 ${childCount} 个键`;
  if (typeof value === 'string') return compactJsonTreeText(JSON.stringify(value), maxLength);
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

    const message = formatUnknownError(error);
    throw new Error(`JSON 结构解析失败: ${message}`);
  }
};

const createPendingChild = (frame: PendingTreeChildrenFrame): PendingTreeNode | null => {
  const { parent, nextIndex, objectKeyIterator } = frame;
  let value: JsonValue | undefined;
  let keyLabel: string;
  let path: string;
  let pointerSegment: string;

  if (Array.isArray(parent.value)) {
    value = parent.value[nextIndex];
    keyLabel = `[${nextIndex}]`;
    path = appendJsonPathIndex(parent.path, nextIndex);
    pointerSegment = String(nextIndex);
  } else {
    const key = objectKeyIterator?.next().value;
    if (key === undefined || !isJsonObject(parent.value)) return null;
    value = parent.value[key];
    keyLabel = key;
    path = appendJsonPathKey(parent.path, key);
    pointerSegment = key;
  }

  if (value === undefined) return null;

  return {
    value,
    path,
    jsonPointer: appendJsonPointerSegment(parent.jsonPointer, pointerSegment),
    parentPath: parent.path,
    ancestorPaths: [...parent.ancestorPaths, parent.path],
    keyLabel,
    depth: parent.depth + 1,
  };
};

const pushNextChild = (
  stack: PendingTreeFrame[],
  frame: PendingTreeChildrenFrame
): void => {
  const child = createPendingChild(frame);
  const nextIndex = frame.nextIndex + 1;
  if (nextIndex < frame.childCount) {
    stack.push({ ...frame, nextIndex });
  }
  if (child) {
    stack.push({ type: 'node', node: child });
  }
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
  const rootValue = parseJsonTreeSource(source);
  const nodes: JsonTreeNode[] = [];
  const stack: PendingTreeFrame[] = [{
    type: 'node',
    node: {
      value: rootValue,
      path: '$',
      jsonPointer: '',
      parentPath: null,
      ancestorPaths: [],
      keyLabel: '$',
      depth: 0,
    },
  }];
  let isLimited = false;

  while (stack.length > 0) {
    if (nodes.length >= maxNodes) {
      isLimited = true;
      break;
    }

    const frame = stack.pop();
    if (!frame) break;
    if (frame.type === 'children') {
      pushNextChild(stack, frame);
      continue;
    }

    const current = frame.node;
    const objectValue = isJsonObject(current.value) ? current.value : null;
    const childCount = Array.isArray(current.value)
      ? current.value.length
      : objectValue ? countObjectKeys(objectValue) : 0;
    const kind = getNodeKind(current.value);
    const valuePreview = getValuePreview(current.value, childCount, previewMaxLength);
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

    stack.push({
      type: 'children',
      parent: current,
      childCount,
      objectKeyIterator: objectValue ? iterateObjectKeys(objectValue) : null,
      nextIndex: 0,
    });
  }

  return {
    nodes,
    totalNodes: nodes.length,
    isLimited,
    maxNodes,
    maxDepth,
  };
};
