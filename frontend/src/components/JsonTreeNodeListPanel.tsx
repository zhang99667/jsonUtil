import React from 'react';
import type { JsonTreeNode } from '../utils/jsonTreeModel';
import {
  getJsonTreeKindClassName,
  JSON_TREE_KIND_LABELS,
} from '../utils/jsonTreePresentation';

interface JsonTreeNodeListPanelProps {
  nodes: JsonTreeNode[];
  selectedPath: string | null;
  expandedPaths: Set<string>;
  searchText: string;
  onToggleNode: (node: JsonTreeNode) => void;
  onSelectNode: (node: JsonTreeNode) => void;
  onCopyPath: (path: string) => void;
}

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

export const JsonTreeNodeListPanel: React.FC<JsonTreeNodeListPanelProps> = ({
  nodes,
  selectedPath,
  expandedPaths,
  searchText,
  onToggleNode,
  onSelectNode,
  onCopyPath,
}) => {
  const searchHighlightTokens = getSearchHighlightTokens(searchText);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
      <div className="space-y-1">
        {nodes.map(node => {
          const isExpanded = expandedPaths.has(node.path);
          const isSelected = selectedPath === node.path;
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
                onClick={() => onToggleNode(node)}
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
                onClick={() => onSelectNode(node)}
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
                onClick={() => onCopyPath(node.path)}
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
