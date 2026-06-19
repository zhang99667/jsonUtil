import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { buildJsonTreeModel, type JsonTreeNode } from '../utils/jsonTreeModel';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { showError, showSuccess } from '../utils/toast';

interface JsonTreePanelProps {
  jsonData: string;
  isDataPreparing: boolean;
  isOpen: boolean;
  onClose: () => void;
  onLocatePath: (path: string) => void;
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

const getVisibleNodes = (
  nodes: JsonTreeNode[],
  expandedPaths: Set<string>,
  searchText: string
): JsonTreeNode[] => {
  const normalizedSearch = searchText.trim().toLowerCase();
  if (normalizedSearch) {
    return nodes.filter(node => node.searchText.includes(normalizedSearch));
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
  const [searchText, setSearchText] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['$']));
  const modelResult = useMemo(() => {
    if (!isOpen || isDataPreparing || !jsonData.trim()) {
      return { model: null, error: '' };
    }

    try {
      return {
        model: buildJsonTreeModel(jsonData),
        error: '',
      };
    } catch (error) {
      return {
        model: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [isDataPreparing, isOpen, jsonData]);
  const nodes = modelResult.model?.nodes || [];
  const visibleNodes = useMemo(
    () => getVisibleNodes(nodes, expandedPaths, searchText),
    [expandedPaths, nodes, searchText]
  );
  const containerCount = useMemo(
    () => nodes.filter(node => node.isContainer).length,
    [nodes]
  );

  useEffect(() => {
    if (!isOpen || !modelResult.model) return;

    setExpandedPaths(new Set(
      modelResult.model.nodes
        .filter(node => node.isContainer && node.depth <= 1)
        .map(node => node.path)
    ));
  }, [isOpen, modelResult.model]);

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

  const handleCopyPath = async (path: string) => {
    try {
      await copyText(path);
      showSuccess('已复制 JSONPath');
    } catch (error) {
      showError(getClipboardErrorMessage(error, '复制 JSONPath 失败'));
    }
  };

  const handleLocatePath = (path: string) => {
    onLocatePath(path);
  };

  const renderBody = () => {
    if (isDataPreparing) {
      return (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
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

    if (modelResult.error) {
      return (
        <div className="m-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm leading-6 text-red-100">
          {modelResult.error}
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
            const indent = Math.min(node.depth * 14, 140);

            return (
              <div
                key={node.id}
                data-tour="structure-nav-row"
                className="group flex min-h-[34px] items-center gap-1 rounded border border-transparent px-2 py-1 text-xs text-gray-300 hover:border-editor-border hover:bg-editor-hover/70"
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
                  onClick={() => handleLocatePath(node.path)}
                  className="min-w-0 flex flex-1 items-center gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-editor-active focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  title={`定位 ${node.path}`}
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
            {modelResult.model
              ? `${modelResult.model.totalNodes} 个节点 / ${containerCount} 个容器${modelResult.model.isLimited ? `，已按 ${modelResult.model.maxNodes} 节点上限截断` : ''}`
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

        {renderBody()}
      </div>
    </DraggablePanel>
  );
};
