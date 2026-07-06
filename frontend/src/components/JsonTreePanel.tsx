import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { JsonTreeGraphPanel } from './JsonTreeGraphPanel';
import { JsonTreeSelectedNodeDetailsPanel } from './JsonTreeSelectedNodeDetailsPanel';
import type { JsonTreeArrayTablePreview, JsonTreeModel, JsonTreeNode } from '../utils/jsonTreeModel';
import {
  buildJsonTreeGraphView,
  buildJsonTreeArrayTablePreview,
  filterJsonTreeArrayTablePreviewColumns,
  formatJsonTreeSearchResultsCsvText,
  formatJsonTreeSearchResultsText,
  formatJsonTreeSearchResultsMarkdownText,
  formatJsonTreeArrayTableCsvText,
  formatJsonTreeArrayTableJsonText,
  getJsonTreeNodeValue,
  getJsonTreeNodeValueCopyText,
  matchesJsonTreeSearchText,
  resolveJsonTreeFocusTarget,
  type JsonTreeFocusTarget,
} from '../utils/jsonTreeModel';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import {
  getJsonStringSemanticHints,
  isJsonStringSemanticHintActionable,
} from '../utils/jsonValueSemantics';
import { jsonValueToTypeScriptDeclaration } from '../utils/jsonToTypeScript';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import {
  addJsonTreeSearchHistoryItem,
  JSON_TREE_SEARCH_HISTORY_STORAGE_KEY,
  parseStoredJsonTreeSearchHistory,
  removeJsonTreeSearchHistoryItem,
} from '../utils/jsonTreeSearchHistory';
import { safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from '../utils/storage';
import { showError, showSuccess } from '../utils/toast';
import { formatJsonPathRecursiveFieldQuery } from '../utils/jsonPathInput';
import {
  getJsonTreeKindClassName,
  isJsonTreeArrayIndexKeyLabel,
  JSON_TREE_KIND_LABELS,
} from '../utils/jsonTreePresentation';

interface JsonTreePanelProps {
  jsonData: string;
  isDataPreparing: boolean;
  isOpen: boolean;
  externalFocusRequest?: (JsonTreeFocusTarget & { id: number }) | null;
  onClose: () => void;
  onLocatePath: (path: string) => void;
  onOpenSchemeValue: (value: string) => void;
}

interface JsonTreeWorkerResponse {
  id: number;
  model: JsonTreeModel | null;
  error?: string;
}

interface JsonTreeModelState {
  model: JsonTreeModel | null;
  error: string;
  isLoading: boolean;
}

type JsonTreeKindFilter = JsonTreeNode['kind'] | 'all';
type JsonTreePanelViewMode = 'list' | 'graph';

const KIND_FILTER_OPTIONS: Array<{ value: JsonTreeKindFilter; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'object', label: '对象' },
  { value: 'array', label: '数组' },
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
  { value: 'null', label: '空值' },
];

const escapeRegExp = (value: string): string => (
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
);

const getSearchHighlightTokens = (searchText: string): string[] => (
  [...new Set(searchText
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean))]
    .sort((left, right) => right.length - left.length)
);

const renderHighlightedText = (text: string, tokens: string[]): React.ReactNode => {
  if (tokens.length === 0) return text;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'ig');
  const parts = text.split(pattern).filter(part => part.length > 0);

  return parts.map((part, index) => (
    tokens.some(token => token.toLowerCase() === part.toLowerCase())
      ? (
        <mark key={`${part}-${index}`} className="rounded bg-amber-300/20 px-0.5 text-amber-100">
          {part}
        </mark>
      )
      : part
  ));
};

const getVisibleNodes = (
  nodes: JsonTreeNode[],
  expandedPaths: Set<string>,
  searchText: string,
  kindFilter: JsonTreeKindFilter
): JsonTreeNode[] => {
  const normalizedSearch = searchText.trim().toLowerCase();
  const hasTypeFilter = kindFilter !== 'all';
  const baseNodes = normalizedSearch || hasTypeFilter
    ? nodes
    : nodes.filter(node => (
      node.depth === 0 || node.ancestorPaths.every(path => expandedPaths.has(path))
    ));

  return baseNodes.filter(node => (
    (!normalizedSearch || matchesJsonTreeSearchText(node.searchText, normalizedSearch))
    && (!hasTypeFilter || node.kind === kindFilter)
  ));
};

export const JsonTreePanel: React.FC<JsonTreePanelProps> = ({
  jsonData,
  isDataPreparing,
  isOpen,
  externalFocusRequest = null,
  onClose,
  onLocatePath,
  onOpenSchemeValue,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const copyResultsMenuRef = useRef<HTMLDetailsElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const externalFocusRequestIdRef = useRef<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => (
    parseStoredJsonTreeSearchHistory(safeGetStorageItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY))
  ));
  const [kindFilter, setKindFilter] = useState<JsonTreeKindFilter>('all');
  const [tableColumnFilter, setTableColumnFilter] = useState('');
  const [viewMode, setViewMode] = useState<JsonTreePanelViewMode>('list');
  const [selectedPath, setSelectedPath] = useState('$');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['$']));
  const [modelState, setModelState] = useState<JsonTreeModelState>({
    model: null,
    error: '',
    isLoading: false,
  });

  useEffect(() => {
    if (!isOpen || isDataPreparing || !jsonData.trim()) {
      workerRef.current?.terminate();
      workerRef.current = null;
      requestIdRef.current += 1;
      setModelState({ model: null, error: '', isLoading: false });
      return;
    }

    workerRef.current?.terminate();
    const requestId = ++requestIdRef.current;
    const worker = new Worker(new URL('../workers/jsonTree.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    setModelState({ model: null, error: '', isLoading: true });

    worker.onmessage = (event: MessageEvent<JsonTreeWorkerResponse>) => {
      if (event.data.id !== requestId || requestIdRef.current !== requestId) return;
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }

      setModelState({
        model: event.data.model,
        error: event.data.error || '',
        isLoading: false,
      });
    };

    worker.onerror = (event) => {
      if (requestIdRef.current !== requestId) return;
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }

      setModelState({
        model: null,
        error: `JSON 结构解析失败: ${event.message}`,
        isLoading: false,
      });
    };

    worker.postMessage({
      id: requestId,
      jsonData,
    });

    return () => {
      requestIdRef.current += 1;
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
    };
  }, [isDataPreparing, isOpen, jsonData]);

  useEffect(() => {
    safeSetStorageItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    const handleBackupImported = () => {
      setSearchHistory(parseStoredJsonTreeSearchHistory(safeGetStorageItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY)));
    };

    window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
  }, []);

  const nodes = modelState.model?.nodes || [];
  const hasActiveFilter = Boolean(searchText.trim()) || kindFilter !== 'all';
  const searchHighlightTokens = useMemo(
    () => getSearchHighlightTokens(searchText),
    [searchText]
  );
  const visibleNodes = useMemo(
    () => getVisibleNodes(nodes, expandedPaths, searchText, kindFilter),
    [expandedPaths, kindFilter, nodes, searchText]
  );
  const graphSourceNodes = useMemo(() => {
    if (!hasActiveFilter) return nodes;

    const graphPathSet = new Set<string>();
    visibleNodes.forEach(node => {
      graphPathSet.add(node.path);
      node.ancestorPaths.forEach(path => graphPathSet.add(path));
    });
    return nodes.filter(node => graphPathSet.has(node.path));
  }, [hasActiveFilter, nodes, visibleNodes]);
  const graphView = useMemo(
    () => buildJsonTreeGraphView(graphSourceNodes),
    [graphSourceNodes]
  );
  const containerCount = useMemo(
    () => nodes.filter(node => node.isContainer).length,
    [nodes]
  );
  const selectedNode = useMemo(
    () => nodes.find(node => node.path === selectedPath) || nodes[0] || null,
    [nodes, selectedPath]
  );
  const selectedArrayTablePreview = useMemo(() => {
    if (!selectedNode || selectedNode.kind !== 'array') return null;

    try {
      return buildJsonTreeArrayTablePreview(jsonData, selectedNode.jsonPointer);
    } catch {
      return null;
    }
  }, [jsonData, selectedNode?.jsonPointer, selectedNode?.kind]);
  const visibleArrayTablePreview = useMemo(() => (
    selectedArrayTablePreview
      ? filterJsonTreeArrayTablePreviewColumns(selectedArrayTablePreview, tableColumnFilter)
      : null
  ), [selectedArrayTablePreview, tableColumnFilter]);
  const selectedStringValue = useMemo(() => {
    if (!selectedNode || selectedNode.kind !== 'string') return null;

    try {
      const value = getJsonTreeNodeValue(jsonData, selectedNode.jsonPointer);
      return typeof value === 'string' ? value : null;
    } catch {
      return null;
    }
  }, [jsonData, selectedNode?.jsonPointer, selectedNode?.kind]);
  const selectedSemanticHints = useMemo(() => {
    if (selectedStringValue === null || !selectedNode) return [];

    return getJsonStringSemanticHints(selectedStringValue, {
      keyLabel: selectedNode.keyLabel,
      path: selectedNode.path,
    });
  }, [selectedNode?.keyLabel, selectedNode?.path, selectedStringValue]);
  const canOpenSelectedSemanticValue = selectedStringValue !== null &&
    selectedSemanticHints.some(isJsonStringSemanticHintActionable);
  const canQuerySelectedField = Boolean(selectedNode && selectedNode.path !== '$' && !isJsonTreeArrayIndexKeyLabel(selectedNode.keyLabel));

  useEffect(() => {
    if (!isOpen || !modelState.model) return;

    setExpandedPaths(new Set(
      modelState.model.nodes
        .filter(node => node.isContainer && node.depth <= 1)
        .map(node => node.path)
    ));
    setSelectedPath(prevPath => (
      modelState.model?.nodes.some(node => node.path === prevPath) ? prevPath : '$'
    ));
  }, [isOpen, modelState.model]);

  useEffect(() => {
    if (!isOpen || !modelState.model || !externalFocusRequest) return;
    if (externalFocusRequestIdRef.current === externalFocusRequest.id) return;

    externalFocusRequestIdRef.current = externalFocusRequest.id;
    const targetNode = resolveJsonTreeFocusTarget(modelState.model.nodes, externalFocusRequest);
    if (!targetNode) {
      showError('结构导航未找到对应节点');
      return;
    }

    setSearchText('');
    setKindFilter('all');
    setSelectedPath(targetNode.path);
    setExpandedPaths(prev => new Set([...prev, ...targetNode.ancestorPaths]));
  }, [externalFocusRequest, isOpen, modelState.model]);

  useEffect(() => {
    if (!selectedNode || visibleNodes.length === 0) return;
    if (visibleNodes.some(node => node.path === selectedNode.path)) return;

    setSelectedPath(visibleNodes[0]?.path || '$');
  }, [selectedNode, visibleNodes]);

  useEffect(() => {
    setTableColumnFilter('');
  }, [selectedNode?.path]);

  const handleToggleNode = (node: JsonTreeNode) => {
    if (!node.isContainer) return;

    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(node.path)) {
        next.delete(node.path);
      } else {
        next.add(node.path);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedPaths(new Set(nodes.filter(node => node.isContainer).map(node => node.path)));
  };

  const handleCollapseAll = () => {
    setExpandedPaths(new Set(['$']));
  };

  const handleCopyText = async (text: string, successMessage: string, errorMessage: string) => {
    try {
      await copyText(text);
      showSuccess(successMessage);
    } catch (error) {
      showError(getClipboardErrorMessage(error, errorMessage));
    }
  };

  const handleCopyPath = async (path: string) => {
    await handleCopyText(path, '已复制 JSONPath', '复制 JSONPath 失败');
  };

  const handleCopyPointer = async (node: JsonTreeNode) => {
    await handleCopyText(node.jsonPointer, '已复制 JSON Pointer', '复制 JSON Pointer 失败');
  };

  const handleCopyNodeValue = async (node: JsonTreeNode, pretty: boolean) => {
    try {
      const copyTextValue = getJsonTreeNodeValueCopyText(jsonData, node.jsonPointer, { pretty });
      await copyText(copyTextValue);
      showSuccess(pretty ? '已复制格式化节点值' : '已复制节点值');
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制节点值失败'));
    }
  };

  const handleCopyNodeSubtree = async (node: JsonTreeNode) => {
    try {
      const copyTextValue = getJsonTreeNodeValueCopyText(jsonData, node.jsonPointer, { pretty: true });
      await copyText(copyTextValue);
      showSuccess('已复制节点子树');
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制节点子树失败'));
    }
  };

  const handleCopyNodeTypeScript = async (node: JsonTreeNode) => {
    try {
      const nodeValue = getJsonTreeNodeValue(jsonData, node.jsonPointer);
      const parentNode = node.parentPath ? nodes.find(item => item.path === node.parentPath) : null;
      const rootName = node.path === '$'
        ? 'Root'
        : isJsonTreeArrayIndexKeyLabel(node.keyLabel)
          ? `${parentNode?.keyLabel || 'Root'}Item`
          : node.keyLabel;
      const declaration = jsonValueToTypeScriptDeclaration(nodeValue, {
        rootName,
        includeSummary: true,
      });
      await copyText(declaration);
      showSuccess('已复制 TS 类型');
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制 TS 类型失败'));
    }
  };

  const closeCopyResultsMenu = () => {
    if (copyResultsMenuRef.current) {
      copyResultsMenuRef.current.open = false;
    }
  };

  const commitSearchHistory = () => {
    if (!searchText.trim()) return;
    setSearchHistory(prev => addJsonTreeSearchHistoryItem(prev, searchText));
  };

  const handleSearchInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitSearchHistory();
    }
  };

  const handleFillSearchHistory = (query: string) => {
    setSearchText(query);
    setSearchHistory(prev => addJsonTreeSearchHistoryItem(prev, query));
    searchInputRef.current?.focus();
  };

  const handleRemoveSearchHistory = (query: string) => {
    setSearchHistory(prev => removeJsonTreeSearchHistoryItem(prev, query));
  };

  const handleClearSearchHistory = () => {
    setSearchHistory([]);
    safeRemoveStorageItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY);
  };

  const handleCopySearchResultsJson = async () => {
    if (!hasActiveFilter || visibleNodes.length === 0) return;

    commitSearchHistory();
    await handleCopyText(
      formatJsonTreeSearchResultsText(visibleNodes),
      '已复制搜索结果',
      '复制搜索结果失败'
    );
    closeCopyResultsMenu();
  };

  const handleCopySearchResultsMarkdown = async () => {
    if (!hasActiveFilter || visibleNodes.length === 0) return;

    commitSearchHistory();
    await handleCopyText(
      formatJsonTreeSearchResultsMarkdownText(visibleNodes),
      '已复制 Markdown 摘要',
      '复制 Markdown 摘要失败'
    );
    closeCopyResultsMenu();
  };

  const handleCopySearchResultsCsv = async () => {
    if (!hasActiveFilter || visibleNodes.length === 0) return;

    commitSearchHistory();
    await handleCopyText(
      formatJsonTreeSearchResultsCsvText(visibleNodes),
      '已复制 CSV 摘要',
      '复制 CSV 摘要失败'
    );
    closeCopyResultsMenu();
  };

  const handleCopyArrayTableJson = async (preview: JsonTreeArrayTablePreview) => {
    await handleCopyText(
      formatJsonTreeArrayTableJsonText(preview),
      '已复制表格 JSON',
      '复制表格 JSON 失败'
    );
  };

  const handleCopyArrayTableCsv = async (preview: JsonTreeArrayTablePreview) => {
    await handleCopyText(
      formatJsonTreeArrayTableCsvText(preview),
      '已复制表格 CSV',
      '复制表格 CSV 失败'
    );
  };

  const handleLocatePath = (path: string) => {
    onLocatePath(path);
  };

  const handleOpenSelectedSemanticValue = () => {
    if (selectedStringValue === null) return;

    onOpenSchemeValue(selectedStringValue);
    showSuccess('已填入 Scheme 解析');
  };

  const handleQuerySelectedField = (node: JsonTreeNode) => {
    if (node.path === '$' || isJsonTreeArrayIndexKeyLabel(node.keyLabel)) return;

    handleLocatePath(formatJsonPathRecursiveFieldQuery(node.keyLabel));
    showSuccess('已填入同名字段查询');
  };

  const handleSelectNode = (node: JsonTreeNode) => {
    commitSearchHistory();
    setSelectedPath(node.path);
    handleLocatePath(node.path);
  };

  const handleSelectGraphNode = (path: string) => {
    const node = nodes.find(item => item.path === path);
    if (!node) return;
    handleSelectNode(node);
    setExpandedPaths(prev => new Set([...prev, ...node.ancestorPaths]));
  };

  const renderSelectedNodeDetails = () => {
    if (!selectedNode || modelState.isLoading || modelState.error || !jsonData.trim()) return null;

    return (
      <JsonTreeSelectedNodeDetailsPanel
        selectedNode={selectedNode}
        selectedSemanticHints={selectedSemanticHints}
        selectedArrayTablePreview={selectedArrayTablePreview}
        visibleArrayTablePreview={visibleArrayTablePreview}
        tableColumnFilter={tableColumnFilter}
        canQuerySelectedField={canQuerySelectedField}
        canOpenSelectedSemanticValue={canOpenSelectedSemanticValue}
        onCopyPath={(path) => void handleCopyPath(path)}
        onCopyPointer={(node) => void handleCopyPointer(node)}
        onCopyNodeValue={(node, pretty) => void handleCopyNodeValue(node, pretty)}
        onCopyNodeSubtree={(node) => void handleCopyNodeSubtree(node)}
        onCopyNodeTypeScript={(node) => void handleCopyNodeTypeScript(node)}
        onQuerySelectedField={handleQuerySelectedField}
        onOpenSelectedSemanticValue={handleOpenSelectedSemanticValue}
        onTableColumnFilterChange={setTableColumnFilter}
        onCopyTableJson={handleCopyArrayTableJson}
        onCopyTableCsv={handleCopyArrayTableCsv}
      />
    );
  };

  const renderBody = () => {
    if (isDataPreparing) {
      return (
        <div role="status" className="flex flex-1 items-center justify-center text-sm text-gray-400">
          预览仍在处理，请稍候...
        </div>
      );
    }

    if (!jsonData.trim()) {
      return (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-gray-400">
          请先在 SOURCE 输入 JSON，再打开结构导航。
        </div>
      );
    }

    if (modelState.isLoading) {
      return (
        <div role="status" className="flex flex-1 items-center justify-center text-sm text-gray-400">
          结构导航正在解析，请稍候...
        </div>
      );
    }

    if (modelState.error) {
      return (
        <div role="alert" className="m-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm leading-6 text-red-100">
          {modelState.error}
        </div>
      );
    }

    if (visibleNodes.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-gray-400">
          没有匹配的路径、字段、值或类型。
        </div>
      );
    }

    if (viewMode === 'graph') {
      return (
        <JsonTreeGraphPanel
          graphView={graphView}
          selectedPath={selectedNode?.path ?? null}
          onSelectNode={handleSelectGraphNode}
        />
      );
    }

    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <div className="space-y-1">
          {visibleNodes.map(node => {
            const isExpanded = expandedPaths.has(node.path);
            const isSelected = selectedNode?.path === node.path;
            const indent = Math.min(node.depth * 14, 140);

            return (
              <div
                key={node.id}
                data-tour="structure-nav-row"
                className={`group flex min-h-[34px] items-center gap-1 rounded border px-2 py-1 text-xs text-gray-300 hover:border-editor-border hover:bg-editor-hover/70 ${isSelected ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-transparent'}`}
                style={{ paddingLeft: `${8 + indent}px` }}
              >
                <button
                  type="button"
                  onClick={() => handleToggleNode(node)}
                  disabled={!node.isContainer}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-editor-active hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                  title={node.isContainer ? (isExpanded ? '折叠节点' : '展开节点') : '叶子节点'}
                  aria-label={`${node.isContainer ? (isExpanded ? '折叠' : '展开') : '叶子'} ${node.path}`}
                >
                  {node.isContainer ? (
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6 3.5 10.5 8 6 12.5z" />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectNode(node)}
                  className="min-w-0 flex flex-1 items-center gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-editor-active focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                  title={`选中并定位 ${node.path}`}
                >
                  <span className="max-w-[160px] shrink-0 truncate font-mono text-[11px] font-semibold text-gray-100">
                    {renderHighlightedText(node.keyLabel, searchHighlightTokens)}
                  </span>
                  <span className={`shrink-0 rounded border px-1 py-0.5 text-[10px] leading-none ${getJsonTreeKindClassName(node.kind)}`}>
                    {JSON_TREE_KIND_LABELS[node.kind]}
                  </span>
                  <span className="min-w-0 truncate font-mono text-[11px] text-gray-400">
                    {renderHighlightedText(node.valuePreview, searchHighlightTokens)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleCopyPath(node.path)}
                  className="shrink-0 rounded px-1.5 py-1 font-mono text-[10px] text-gray-500 opacity-0 transition-colors hover:bg-editor-active hover:text-emerald-200 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                  title={`复制路径 ${node.path}`}
                  aria-label={`复制路径 ${node.path}`}
                >
                  PATH
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="结构导航"
      ariaLabel="JSON 结构导航"
      initialFocusRef={searchInputRef}
      icon={PanelIcons.Code}
      storageKey="structure-nav-panel"
      defaultPosition={{ x: 220, y: 96 }}
      defaultSize={{ width: 620, height: 520 }}
      minSize={{ width: 460, height: 340 }}
      dataTour="structure-nav-panel"
      footer={
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-xs text-gray-400">
          <span className="truncate">
            {modelState.isLoading
              ? '结构导航解析中...'
              : modelState.model
                ? `${hasActiveFilter ? `${visibleNodes.length}/${modelState.model.totalNodes} 个匹配` : `${modelState.model.totalNodes} 个节点`} / ${containerCount} 个容器${modelState.model.isLimited ? `，已按 ${modelState.model.maxNodes} 节点上限截断` : ''}`
              : '结构导航'}
          </span>
          <span className="shrink-0">点击节点可定位，PATH 可复制路径</span>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-editor-border px-3 py-2">
          <input
            ref={searchInputRef}
            data-tour="structure-nav-search"
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={handleSearchInputKeyDown}
            placeholder="搜索路径、字段或值"
            aria-label="搜索 JSON 结构"
            className="min-w-0 flex-1 rounded border border-editor-border bg-editor-bg px-2 py-1.5 font-mono text-xs text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500"
          />
          <select
            data-tour="structure-nav-kind-filter"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as JsonTreeKindFilter)}
            aria-label="筛选节点类型"
            className="w-24 shrink-0 rounded border border-editor-border bg-editor-bg px-2 py-1.5 text-xs text-gray-200 outline-none transition-colors focus:border-emerald-500"
            title="按节点类型筛选"
          >
            {KIND_FILTER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div
            role="group"
            aria-label="结构导航视图"
            className="flex shrink-0 overflow-hidden rounded border border-editor-border"
          >
            {(['list', 'graph'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                data-tour={`structure-nav-view-${mode}`}
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`px-2 py-1.5 text-xs transition-colors ${
                  viewMode === mode
                    ? 'bg-brand-primary text-white'
                    : 'bg-editor-bg text-gray-400 hover:bg-editor-hover hover:text-gray-200'
                }`}
              >
                {mode === 'list' ? '列表' : '图谱'}
              </button>
            ))}
          </div>
          {hasActiveFilter && visibleNodes.length > 0 ? (
            <details ref={copyResultsMenuRef} className="relative shrink-0">
              <summary
                data-tour="structure-nav-copy-search-results-menu"
                className="w-12 list-none rounded border border-editor-border px-2 py-1.5 text-center text-xs text-gray-300 transition-colors hover:bg-editor-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 [&::-webkit-details-marker]:hidden"
                title="复制当前筛选结果"
                aria-label="复制当前筛选结果"
              >
                结果
              </summary>
              <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded border border-editor-border bg-editor-sidebar py-1 text-xs shadow-xl shadow-black/30">
                <button
                  type="button"
                  data-tour="structure-nav-copy-search-results"
                  onClick={() => void handleCopySearchResultsJson()}
                  className="block w-full px-2 py-1.5 text-left text-gray-300 transition-colors hover:bg-editor-hover hover:text-emerald-100"
                >
                  JSON 清单
                </button>
                <button
                  type="button"
                  data-tour="structure-nav-copy-search-results-markdown"
                  onClick={() => void handleCopySearchResultsMarkdown()}
                  className="block w-full px-2 py-1.5 text-left text-gray-300 transition-colors hover:bg-editor-hover hover:text-cyan-100"
                >
                  Markdown 摘要
                </button>
                <button
                  type="button"
                  data-tour="structure-nav-copy-search-results-csv"
                  onClick={() => void handleCopySearchResultsCsv()}
                  className="block w-full px-2 py-1.5 text-left text-gray-300 transition-colors hover:bg-editor-hover hover:text-amber-100"
                >
                  CSV 摘要
                </button>
              </div>
            </details>
          ) : (
            <button
              type="button"
              data-tour="structure-nav-copy-search-results"
              disabled
              className="w-12 rounded border border-editor-border px-2 py-1.5 text-center text-xs text-gray-300 opacity-50"
              title="有搜索或类型筛选结果后可复制"
            >
              结果
            </button>
          )}
          <button
            type="button"
            onClick={handleExpandAll}
            disabled={nodes.length === 0}
            className="rounded border border-editor-border px-2 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
            title="展开全部容器节点"
          >
            展开
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            disabled={nodes.length === 0}
            className="rounded border border-editor-border px-2 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
            title="折叠到根节点"
          >
            折叠
          </button>
        </div>

        {searchHistory.length > 0 && (
          <div
            data-tour="structure-nav-search-history"
            className="flex shrink-0 items-center gap-2 border-b border-editor-border bg-editor-bg/60 px-3 py-1.5 text-[11px]"
          >
            <span className="shrink-0 text-gray-500">最近</span>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {searchHistory.map(item => (
                <span
                  key={item}
                  className="group/history-item inline-flex max-w-[180px] shrink-0 items-center rounded border border-editor-border bg-editor-sidebar text-gray-300 transition-colors hover:border-emerald-500/40 hover:bg-editor-hover"
                >
                  <button
                    type="button"
                    data-tour="structure-nav-search-history-item"
                    onClick={() => handleFillSearchHistory(item)}
                    className="min-w-0 truncate px-2 py-1 font-mono text-[11px] text-gray-300 transition-colors hover:text-emerald-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                    title={`${item}\n点击填入结构搜索`}
                    aria-label={`填入结构搜索历史：${item}`}
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSearchHistory(item)}
                    className="shrink-0 rounded-r px-1 py-1 text-gray-500 opacity-0 transition-colors hover:text-red-300 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 group-hover/history-item:opacity-100"
                    title={`删除结构搜索历史：${item}`}
                    aria-label={`删除结构搜索历史：${item}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleClearSearchHistory}
              className="shrink-0 rounded px-1.5 py-1 text-gray-500 transition-colors hover:bg-editor-hover hover:text-gray-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
              title="清空结构搜索历史"
              aria-label="清空结构搜索历史"
            >
              清空
            </button>
          </div>
        )}

        {renderSelectedNodeDetails()}
        {renderBody()}
      </div>
    </DraggablePanel>
  );
};
