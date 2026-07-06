import React from 'react';
import type { JsonStringSemanticHint } from '../utils/jsonValueSemantics';
import type { JsonTreeArrayTablePreview, JsonTreeNode } from '../utils/jsonTreeModel';
import { formatJsonPathRecursiveFieldQuery } from '../utils/jsonPathInput';
import {
  getJsonPointerDisplayValue,
  getJsonTreeKindClassName,
  getJsonTreeSemanticHintClassName,
  JSON_TREE_KIND_LABELS,
} from '../utils/jsonTreePresentation';
import { JsonTreeArrayTablePreviewPanel } from './JsonTreeArrayTablePreviewPanel';

interface JsonTreeSelectedNodeDetailsPanelProps {
  selectedNode: JsonTreeNode;
  selectedSemanticHints: JsonStringSemanticHint[];
  selectedArrayTablePreview: JsonTreeArrayTablePreview | null;
  visibleArrayTablePreview: JsonTreeArrayTablePreview | null;
  tableColumnFilter: string;
  canQuerySelectedField: boolean;
  canOpenSelectedSemanticValue: boolean;
  onCopyPath: (path: string) => void;
  onCopyPointer: (node: JsonTreeNode) => void;
  onCopyNodeValue: (node: JsonTreeNode, pretty: boolean) => void;
  onCopyNodeSubtree: (node: JsonTreeNode) => void;
  onCopyNodeTypeScript: (node: JsonTreeNode) => void;
  onQuerySelectedField: (node: JsonTreeNode) => void;
  onOpenSelectedSemanticValue: () => void;
  onTableColumnFilterChange: (value: string) => void;
  onCopyTableJson: (preview: JsonTreeArrayTablePreview) => void;
  onCopyTableCsv: (preview: JsonTreeArrayTablePreview) => void;
}

export const JsonTreeSelectedNodeDetailsPanel: React.FC<JsonTreeSelectedNodeDetailsPanelProps> = ({
  selectedNode,
  selectedSemanticHints,
  selectedArrayTablePreview,
  visibleArrayTablePreview,
  tableColumnFilter,
  canQuerySelectedField,
  canOpenSelectedSemanticValue,
  onCopyPath,
  onCopyPointer,
  onCopyNodeValue,
  onCopyNodeSubtree,
  onCopyNodeTypeScript,
  onQuerySelectedField,
  onOpenSelectedSemanticValue,
  onTableColumnFilterChange,
  onCopyTableJson,
  onCopyTableCsv,
}) => (
  <div className="shrink-0 border-b border-editor-border bg-editor-bg/50 px-3 py-2 text-xs text-gray-300">
    <div className="flex min-w-0 items-center gap-2">
      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] leading-none ${getJsonTreeKindClassName(selectedNode.kind)}`}>
        {JSON_TREE_KIND_LABELS[selectedNode.kind]}
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
      {selectedSemanticHints.length > 0 && (
        <>
          <span className="text-gray-500">语义</span>
          <span data-tour="structure-nav-semantic-hints" className="flex min-w-0 flex-wrap items-center gap-1">
            {selectedSemanticHints.map(hint => (
              <span
                key={`${hint.kind}-${hint.detail}`}
                className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded border px-1.5 py-0.5 ${getJsonTreeSemanticHintClassName(hint.kind)}`}
                title={hint.detail}
              >
                <span className="shrink-0">{hint.label}</span>
                <span className="min-w-0 truncate font-mono text-[10px] opacity-80">{hint.detail}</span>
              </span>
            ))}
          </span>
        </>
      )}
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onCopyPath(selectedNode.path)}
        className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-emerald-100"
      >
        PATH
      </button>
      <button
        type="button"
        onClick={() => onCopyPointer(selectedNode)}
        className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-cyan-100"
      >
        Pointer
      </button>
      <button
        type="button"
        onClick={() => onCopyNodeValue(selectedNode, false)}
        className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-blue-100"
      >
        复制值
      </button>
      <button
        type="button"
        onClick={() => onCopyNodeValue(selectedNode, true)}
        className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-violet-100"
      >
        格式化值
      </button>
      {canQuerySelectedField && (
        <button
          type="button"
          data-tour="structure-nav-query-same-field"
          onClick={() => onQuerySelectedField(selectedNode)}
          aria-label={`查询同名字段：${selectedNode.keyLabel}`}
          className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/20"
          title={`用 ${formatJsonPathRecursiveFieldQuery(selectedNode.keyLabel)} 查询全局同名字段`}
        >
          同名字段
        </button>
      )}
      {canOpenSelectedSemanticValue && (
        <button
          type="button"
          data-tour="structure-nav-open-semantic-value"
          onClick={onOpenSelectedSemanticValue}
          aria-label="继续解析当前语义字符串"
          className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/20"
          title="把当前字符串原始值填入 Scheme/编码解析面板继续排查"
        >
          继续解析
        </button>
      )}
      {selectedNode.isContainer && (
        <button
          type="button"
          data-tour="structure-nav-copy-subtree"
          onClick={() => onCopyNodeSubtree(selectedNode)}
          className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-amber-100"
        >
          子树
        </button>
      )}
      {selectedNode.isContainer && (
        <button
          type="button"
          data-tour="structure-nav-copy-typescript"
          onClick={() => onCopyNodeTypeScript(selectedNode)}
          className="rounded border border-editor-border px-2 py-1 text-[11px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-sky-100"
        >
          TS 类型
        </button>
      )}
    </div>
    <JsonTreeArrayTablePreviewPanel
      sourcePreview={selectedArrayTablePreview}
      preview={visibleArrayTablePreview}
      tableColumnFilter={tableColumnFilter}
      onTableColumnFilterChange={onTableColumnFilterChange}
      onCopyTableJson={onCopyTableJson}
      onCopyTableCsv={onCopyTableCsv}
    />
  </div>
);
