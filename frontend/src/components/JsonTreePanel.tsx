import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { JsonTreeGraphPanel } from './JsonTreeGraphPanel';
import { JsonTreeNodeListPanel } from './JsonTreeNodeListPanel';
import { JsonTreePanelFooter } from './JsonTreePanelFooter';
import { JsonTreeSearchHistoryPanel } from './JsonTreeSearchHistoryPanel';
import { JsonTreeSelectedNodeDetailsPanel } from './JsonTreeSelectedNodeDetailsPanel';
import { JsonTreeToolbar, type JsonTreeKindFilter, type JsonTreePanelViewMode } from './JsonTreeToolbar';
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
import { isJsonTreeArrayIndexKeyLabel } from '../utils/jsonTreePresentation';
import { useJsonTreeModel } from '../hooks/useJsonTreeModel';

interface JsonTreePanelProps {
  jsonData: string;
  isDataPreparing: boolean;
  isOpen: boolean;
  externalFocusRequest?: (JsonTreeFocusTarget & { id: number }) | null;
  onClose: () => void;
  onLocatePath: (path: string) => void;
  onOpenSchemeValue: (value: string) => void;
}

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
  const modelState = useJsonTreeModel(jsonData, {
    enabled: isOpen && !isDataPreparing,
  });

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
      <JsonTreeNodeListPanel
        nodes={visibleNodes}
        selectedPath={selectedNode?.path ?? null}
        expandedPaths={expandedPaths}
        searchText={searchText}
        onToggleNode={handleToggleNode}
        onSelectNode={handleSelectNode}
        onCopyPath={(path) => { void handleCopyPath(path); }}
      />
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
        <JsonTreePanelFooter
          isLoading={modelState.isLoading}
          model={modelState.model}
          hasActiveFilter={hasActiveFilter}
          visibleNodeCount={visibleNodes.length}
          containerCount={containerCount}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <JsonTreeToolbar
          searchInputRef={searchInputRef}
          copyResultsMenuRef={copyResultsMenuRef}
          searchText={searchText}
          kindFilter={kindFilter}
          viewMode={viewMode}
          hasCopyableResults={hasActiveFilter && visibleNodes.length > 0}
          canExpandCollapse={nodes.length > 0}
          onSearchTextChange={setSearchText}
          onSearchInputKeyDown={handleSearchInputKeyDown}
          onKindFilterChange={setKindFilter}
          onViewModeChange={setViewMode}
          onCopySearchResultsJson={() => { void handleCopySearchResultsJson(); }}
          onCopySearchResultsMarkdown={() => { void handleCopySearchResultsMarkdown(); }}
          onCopySearchResultsCsv={() => { void handleCopySearchResultsCsv(); }}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
        />

        <JsonTreeSearchHistoryPanel
          searchHistory={searchHistory}
          onFillSearchHistory={handleFillSearchHistory}
          onRemoveSearchHistory={handleRemoveSearchHistory}
          onClearSearchHistory={handleClearSearchHistory}
        />

        {renderSelectedNodeDetails()}
        {renderBody()}
      </div>
    </DraggablePanel>
  );
};
