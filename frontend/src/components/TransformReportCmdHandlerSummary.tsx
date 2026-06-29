import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';

interface TransformReportCmdHandlerSummaryProps {
  record: TransformReportRecord;
  onFilter: (query: string) => void;
}

export const TransformReportCmdHandlerSummary: React.FC<TransformReportCmdHandlerSummaryProps> = ({
  record,
  onFilter,
}) => (
  <div data-tour="transform-report-cmd-handler-summary" className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
    <span className="rounded bg-emerald-950/40 px-2 py-0.5 text-emerald-200 border border-emerald-800/50">
      cmdHandler
    </span>
    {record.commandSchema && (
      <button
        type="button"
        data-tour="transform-report-filter-command-schema"
        onClick={() => onFilter(record.commandSchema || '')}
        className="max-w-full rounded bg-editor-bg px-2 py-0.5 font-mono text-teal-200 transition-colors hover:bg-editor-active"
        title={record.commandSchema}
      >
        <span className="text-gray-500">cmdSchema: </span>
        <span className="inline-block max-w-[220px] truncate align-bottom">
          {record.commandSchema}
        </span>
      </button>
    )}
    <span className="rounded bg-editor-bg px-2 py-0.5 text-gray-300">
      cmdParams · {record.commandParamCount}
    </span>
    {record.commandParamKeys?.map(key => (
      <button
        key={`${record.path}:cmd-param:${key}`}
        type="button"
        data-tour="transform-report-filter-command-param"
        onClick={() => onFilter(key)}
        className="rounded bg-emerald-950/25 px-2 py-0.5 font-mono text-emerald-100 transition-colors hover:bg-emerald-900/45"
        title={`筛选 cmdParams.${key}`}
      >
        {key}
      </button>
    ))}
    {(record.commandParamKeys?.length || 0) < (record.commandParamCount || 0) && (
      <span className="rounded bg-editor-bg px-2 py-0.5 text-gray-500">
        +{(record.commandParamCount || 0) - (record.commandParamKeys?.length || 0)}
      </span>
    )}
  </div>
);
