import React from 'react';
import type { JsonTreeArrayTablePreview } from '../utils/jsonTreeModel';

interface JsonTreeArrayTablePreviewPanelProps {
  sourcePreview: JsonTreeArrayTablePreview | null;
  preview: JsonTreeArrayTablePreview | null;
  tableColumnFilter: string;
  onTableColumnFilterChange: (value: string) => void;
  onCopyTableJson: (preview: JsonTreeArrayTablePreview) => void | Promise<void>;
  onCopyTableCsv: (preview: JsonTreeArrayTablePreview) => void | Promise<void>;
}

export const JsonTreeArrayTablePreviewPanel: React.FC<JsonTreeArrayTablePreviewPanelProps> = ({
  sourcePreview,
  preview,
  tableColumnFilter,
  onTableColumnFilterChange,
  onCopyTableJson,
  onCopyTableCsv,
}) => {
  if (!sourcePreview || !preview) return null;

  const hasColumnFilter = Boolean(tableColumnFilter.trim());
  const hasVisibleColumns = preview.columns.length > 0;

  return (
    <div data-tour="structure-nav-table-preview" className="mt-2 rounded border border-editor-border bg-editor-sidebar/60">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-editor-border px-2 py-1.5">
        <span className="min-w-[160px] flex-1 truncate text-[11px] text-gray-300">
          对象数组预览: {preview.sampledRows}/{sourcePreview.totalRows} 行，{preview.columns.length}/{sourcePreview.totalColumns} 列
          {(sourcePreview.isRowLimited || sourcePreview.isColumnLimited || sourcePreview.isScanLimited) && '，已截断'}
          {hasColumnFilter && `，列筛选 ${preview.columns.length}/${sourcePreview.totalColumns}`}
          {preview.isRowResampled && '，行重采样'}
        </span>
        <span className="flex min-w-0 shrink-0 items-center gap-1">
          <input
            data-tour="structure-nav-table-column-filter"
            type="text"
            value={tableColumnFilter}
            onChange={(event) => onTableColumnFilterChange(event.target.value)}
            placeholder="筛列名"
            aria-label="筛选表格列名"
            title="筛选前 200 行扫描到的表格列；稀疏字段会重采样包含该字段的行"
            className="h-6 w-24 rounded border border-editor-border bg-editor-bg px-1.5 font-mono text-[10px] text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500"
          />
          <button
            type="button"
            data-tour="structure-nav-copy-table-json"
            onClick={() => { void onCopyTableJson(preview); }}
            disabled={!hasVisibleColumns}
            className="rounded border border-editor-border px-1.5 py-0.5 text-[10px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-blue-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-300"
          >
            JSON
          </button>
          <button
            type="button"
            data-tour="structure-nav-copy-table-csv"
            onClick={() => { void onCopyTableCsv(preview); }}
            disabled={!hasVisibleColumns}
            className="rounded border border-editor-border px-1.5 py-0.5 text-[10px] text-gray-300 transition-colors hover:bg-editor-hover hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-300"
          >
            CSV
          </button>
        </span>
      </div>
      {!hasVisibleColumns ? (
        <div className="px-2 py-3 text-center text-[11px] text-gray-500">
          没有匹配的表格列。
        </div>
      ) : (
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
      )}
    </div>
  );
};
