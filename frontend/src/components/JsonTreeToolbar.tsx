import React from 'react';
import type { JsonTreeNodeKind } from '../utils/jsonTreeModel';
import { JsonTreeCopySearchResultsMenu } from './JsonTreeCopySearchResultsMenu';

export type JsonTreeKindFilter = JsonTreeNodeKind | 'all';
export type JsonTreePanelViewMode = 'list' | 'graph';

interface JsonTreeToolbarProps {
  searchInputRef: React.Ref<HTMLInputElement>;
  copyResultsMenuRef: React.Ref<HTMLDetailsElement>;
  searchText: string;
  kindFilter: JsonTreeKindFilter;
  viewMode: JsonTreePanelViewMode;
  hasCopyableResults: boolean;
  canExpandCollapse: boolean;
  onSearchTextChange: (value: string) => void;
  onSearchInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onKindFilterChange: (value: JsonTreeKindFilter) => void;
  onViewModeChange: (value: JsonTreePanelViewMode) => void;
  onCopySearchResultsJson: () => void;
  onCopySearchResultsMarkdown: () => void;
  onCopySearchResultsCsv: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const KIND_FILTER_OPTIONS: Array<{ value: JsonTreeKindFilter; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'object', label: '对象' },
  { value: 'array', label: '数组' },
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
  { value: 'null', label: '空值' },
];

export const JsonTreeToolbar: React.FC<JsonTreeToolbarProps> = ({
  searchInputRef,
  copyResultsMenuRef,
  searchText,
  kindFilter,
  viewMode,
  hasCopyableResults,
  canExpandCollapse,
  onSearchTextChange,
  onSearchInputKeyDown,
  onKindFilterChange,
  onViewModeChange,
  onCopySearchResultsJson,
  onCopySearchResultsMarkdown,
  onCopySearchResultsCsv,
  onExpandAll,
  onCollapseAll,
}) => (
  <div className="flex shrink-0 items-center gap-2 border-b border-editor-border px-3 py-2">
    <input
      ref={searchInputRef}
      data-tour="structure-nav-search"
      type="text"
      value={searchText}
      onChange={(event) => onSearchTextChange(event.target.value)}
      onKeyDown={onSearchInputKeyDown}
      placeholder="搜索路径、字段或值"
      aria-label="搜索 JSON 结构"
      className="min-w-0 flex-1 rounded border border-editor-border bg-editor-bg px-2 py-1.5 font-mono text-xs text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500"
    />
    <select
      data-tour="structure-nav-kind-filter"
      value={kindFilter}
      onChange={(event) => onKindFilterChange(event.target.value as JsonTreeKindFilter)}
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
          onClick={() => onViewModeChange(mode)}
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
    <JsonTreeCopySearchResultsMenu
      copyResultsMenuRef={copyResultsMenuRef}
      hasCopyableResults={hasCopyableResults}
      onCopySearchResultsJson={onCopySearchResultsJson}
      onCopySearchResultsMarkdown={onCopySearchResultsMarkdown}
      onCopySearchResultsCsv={onCopySearchResultsCsv}
    />
    <button
      type="button"
      onClick={onExpandAll}
      disabled={!canExpandCollapse}
      className="rounded border border-editor-border px-2 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
      title="展开全部容器节点"
    >
      展开
    </button>
    <button
      type="button"
      onClick={onCollapseAll}
      disabled={!canExpandCollapse}
      className="rounded border border-editor-border px-2 py-1.5 text-xs text-gray-300 transition-colors hover:bg-editor-hover disabled:cursor-not-allowed disabled:opacity-50"
      title="折叠到根节点"
    >
      折叠
    </button>
  </div>
);
