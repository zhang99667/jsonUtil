import React from 'react';
import type { TransformReportCommandSchemaRow } from '../utils/transformSummary';
import { COMMAND_SCHEMA_ROW_DISPLAY_LIMIT } from './TransformReportPanelAtoms';
import type { TransformReportRecordPathActions } from './TransformReportRecordSectionContracts';

interface TransformReportCommandSchemaRowsProps {
  recordPath: string;
  rows: TransformReportCommandSchemaRow[];
  actions: TransformReportRecordPathActions;
}

export const TransformReportCommandSchemaRows: React.FC<TransformReportCommandSchemaRowsProps> = ({
  recordPath,
  rows,
  actions,
}) => (
  <div data-tour="transform-report-command-schema-rows" className="mt-1.5 flex flex-col gap-1">
    <div className="text-gray-500">
      CMD Schema路径 · 显示 {Math.min(rows.length, COMMAND_SCHEMA_ROW_DISPLAY_LIMIT)}/{rows.length} 条
    </div>
    {rows.slice(0, COMMAND_SCHEMA_ROW_DISPLAY_LIMIT).map(row => (
      <div
        key={`${recordPath}:cmd-schema:${row.path}:${row.schema}`}
        data-tour="transform-report-command-schema-row"
        className="flex items-center gap-2 rounded bg-emerald-950/20 px-2 py-1"
      >
        <div className="min-w-0 flex flex-1 items-center gap-1 font-mono overflow-hidden">
          <span className="min-w-0 flex-1 text-emerald-200 truncate" title={row.path}>
            {row.path}
          </span>
          <span className="shrink-0 text-gray-500">=</span>
          <span className="min-w-0 flex-1 text-teal-200 truncate" title={row.schema}>
            {row.schema}
          </span>
        </div>
        <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            data-tour="transform-report-copy-command-schema-path"
            onClick={() => { void actions.onCopyPath(row.path); }}
            className="text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
          >
            复制路径
          </button>
          <button
            type="button"
            data-tour="transform-report-copy-command-schema-row"
            onClick={() => { void actions.onCopyDecodedPathValue(`${row.path} = ${JSON.stringify(row.schema)}`); }}
            className="text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
          >
            复制片段
          </button>
          {actions.onLocatePath && (
            <button
              type="button"
              data-tour="transform-report-locate-command-schema-path"
              onClick={() => actions.onLocatePath?.(row.path)}
              className="text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
            >
              定位
            </button>
          )}
        </div>
      </div>
    ))}
    {rows.length > COMMAND_SCHEMA_ROW_DISPLAY_LIMIT && (
      <div className="text-gray-500">
        还有更多 CMD Schema 路径未展示，可搜索 schema 或来源展示隐藏项
      </div>
    )}
  </div>
);
