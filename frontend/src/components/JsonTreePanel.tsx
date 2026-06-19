import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import type { JsonTreeArrayTablePreview, JsonTreeModel, JsonTreeNode } from '../utils/jsonTreeModel';
import {
  buildJsonTreeArrayTablePreview,
  formatJsonTreeSearchResultsText,
  formatJsonTreeArrayTableCsvText,
  formatJsonTreeArrayTableJsonText,
  getJsonTreeNodeValueCopyText,
  matchesJsonTreeSearchText,
} from '../utils/jsonTreeModel';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { showError, showSuccess } from '../utils/toast';

interface JsonTreePanelProps {
  jsonData: string;
  isDataPreparing: boolean;
  isOpen: boolean;
  onClose: () => void;
  onLocatePath: (path: string) => void;
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

const KIND_LABELS: Record<JsonTreeNode['kind'], string> = {
  object: '对象',
  array: '数组',
  string: '字符串',
  number: '数字',
  boolean: '布尔',
  null: '空值',
};

const getKindClassName = (kind: JsonTreeNode['kind']): string => {
  if (kind === 'object') return 'border-blue-500/30 bg-blue-500/10 text-blue-200';
  if (kind === 'array') return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
  if (kind === 'string') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (kind === 'number') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (kind === 'boolean') return 'border-violet-500/30 bg-violet-500/10 text-violet-200';
  return 'border-gray-500/30 bg-gray-500/10 text-gray-300';
};

const getJsonPointerDisplayValue = (jsonPointer: string): string => (
  jsonPointer || '(root)'
);

const getVisibleNodes = (
  nodes: JsonTreeNode[],
  expandedPaths: Set<string>,
  searchText: string
): JsonTreeNode[] => {
  const normalizedSearch = searchText.trim().toLowerCase();
  if (normalizedSearch) {
    return nodes.filter(node => matchesJsonTreeSearchText(node.searchText, normalizedSearch));
  }

  return nodes.filter(node => (
    node.depth === 0 || node.ancestorPaths.every(path => expandedPaths.has(path))
  ));
};

export const JsonTreePanel: React.FC<JsonTreePanelProps> = ({
  jsonData,
  isDataPreparing,
  isOpen,
  onClose,
  onLocatePath,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [searchText, setSearchText] = useState('');
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
  const nodes = modelState.model?.nodes || [];
  const visibleNodes = useMemo(
    () => getVisibleNodes(nodes, expandedPaths, searchText),
    [expandedPaths, nodes, searchText]
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

  const handleCopySearchResults = async () => {
    if (!searchText.trim() || visibleNodes.length === 0) return;

    await handleCopyText(
      formatJsonTreeSearchResultsText(visibleNodes),
      '已复制搜索结果',
      '复制搜索结果失败'
    );
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

  const handleSelectNode = (node: JsonTreeNode) => {
    setSelectedPath(node.path);
    handleLocatePath(node.path);
  };

  const renderArrayTablePreview = () => {
    const preview = selectedArrayTablePreview;
    if (!preview) return null;

    return (
      <div data-tour="structure-nav-table-preview" className="mt-2 rounded border border-editor-border bg-editor-sidebar/60">
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-editor-border px-2 py-1.5">
          <span className="min-w-0 truncate text-[11px] text-gray-300">
            对象数组预览: {preview.sampledRows}/{preview.totalRows} 行，{preview.columns.length}/{preview.totalColumns} 列
            {(preview.isRowLimited || preview.isColumnLimited) && '，已截断'}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-tour="structure-nav-copy-table-json"
              onClick={() => void handleCopyArrayTableJson(preview)}
              className="rounded border border-editor-border px-1.5 py-0.5 text-[10px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-blue-100"
            >
              JSON
            </button>
            <button
              type="button"
              data-tour="structure-nav-copy-table-csv"
              onClick={() => void handleCopyArrayTableCsv(preview)}
              className="rounded border border-editor-border px-1.5 py-0.5 text-[10px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-emerald-100"
            >
              CSV
            </button>
          </span>
        </div>
        <div className="max-h-40 overflow-auto">
          <table className="min-w-full border-collapse text-left font-mono text-[10px]">
            <thead className="sticky top-0 bg-editor-sidebar text-gray-400">
              <tr>
                <th className="w-10 border-b border-editor-border px-2 py-1 font-medium">#</th>
                {preview.columns.map(column => (
                  <th key={column} className="max-w-[140px] border-b border-editor-border px-2 py-1 font-medium">
                    <span className="block truncate" title={column}>{column}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map(row => (
                <tr key={row.index} className="border-b border-editor-border/60 last:border-b-0">
                  <td className="px-2 py-1 text-gray-500">{row.index}</td>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.index}-${preview.columns[index]}`} className="max-w-[140px] px-2 py-1 text-gray-300">
                      <span className="block truncate" title={row.copyCells[index]}>{cell}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSelectedNodeDetails = () => {
    if (!selectedNode || modelState.isLoading || modelState.error || !jsonData.trim()) return null;

    return (
      <div className="shrink-0 border-b border-editor-border bg-editor-bg/50 px-3 py-2 text-xs text-gray-300">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] leading-none ${getKindClassName(selectedNode.kind)}`}>
            {KIND_LABELS[selectedNode.kind]}
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-gray-100" title={selectedNode.path}>
            {selectedNode.path}
          </span>
          <span className="shrink-0 text-gray-500">
            子节点 {selectedNode.childCount}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-[72px_minmax(0,1fr)] gap-x-2 gap-y-1 text-[11px]">
          <span className="text-gray-500">Pointer</span>
          <span className="truncate font-mono text-cyan-100" title={selectedNode.jsonPointer || '根节点 JSON Pointer 为空字符串'}>
            {getJsonPointerDisplayValue(selectedNode.jsonPointer)}
          </span>
          <span className="text-gray-500">预览</span>
          <span className="truncate font-mono text-gray-300" title={selectedNode.valuePreview}>
            {selectedNode.valuePreview}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyPath(selectedNode.path)}
            className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-emerald-100"
          >
            PATH
          </button>
          <button
            type="button"
            onClick={() => void handleCopyPointer(selectedNode)}
            className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-cyan-100"
          >
            Pointer
          </button>
          <button
            type="button"
            onClick={() => void handleCopyNodeValue(selectedNode, false)}
            className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-blue-100"
          >
            复制值
          </button>
          <button
            type="button"
            onClick={() => void handleCopyNodeValue(selectedNode, true)}
            className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-violet-100"
          >
            格式化值
          </button>
          {selectedNode.isContainer && (
            <button
              type="button"
              data-tour="structure-nav-copy-subtree"
              onClick={() => void handleCopyNodeSubtree(selectedNode)}
              className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-amber-100"
            >
              子树
            </button>
          )}
        </div>
        {renderArrayTablePreview()}
      </div>
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
          没有匹配的路径或字段。
        </div>
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
                  className="min-w-0 flex flex-1 items-center gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-editor-active focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  title={`选中并定位 ${node.path}`}
                >
                  <span className="max-w-[160px] shrink-0 truncate font-mono text-[11px] font-semibold text-gray-100">
                    {node.keyLabel}
                  </span>
                  <span className={`shrink-0 rounded border px-1 py-0.5 text-[10px] leading-none ${getKindClassName(node.kind)}`}>
                    {KIND_LABELS[node.kind]}
                  </span>
                  <span className="min-w-0 truncate font-mono text-[11px] text-gray-400">
                    {node.valuePreview}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleCopyPath(node.path)}
                  className="shrink-0 rounded px-1.5 py-1 font-mono text-[10px] text-gray-500 opacity-0 transition-colors hover:bg-editor-active hover:text-emerald-200 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
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
                ? `${searchText.trim() ? `${visibleNodes.length}/${modelState.model.totalNodes} 个匹配` : `${modelState.model.totalNodes} 个节点`} / ${containerCount} 个容器${modelState.model.isLimited ? `，已按 ${modelState.model.maxNodes} 节点上限截断` : ''}`
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
            placeholder="搜索路径、字段或值"
            aria-label="搜索 JSON 结构"
            className="min-w-0 flex-1 rounded border border-editor-border bg-editor-bg px-2 py-1.5 font-mono text-xs text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500"
          />
          <button
            type="button"
            data-tour="structure-nav-copy-search-results"
            onClick={() => void handleCopySearchResults()}
            disabled={!searchText.trim() || visibleNodes.length === 0}
            className="rounded border border-editor-border px-2 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
            title="复制当前搜索结果"
          >
            结果
          </button>
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

        {renderSelectedNodeDetails()}
        {renderBody()}
      </div>
    </DraggablePanel>
  );
};
