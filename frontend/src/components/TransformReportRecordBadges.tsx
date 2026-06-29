import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';

interface TransformReportRecordBadgesProps {
  record: TransformReportRecord;
}

export const TransformReportRecordBadges: React.FC<TransformReportRecordBadgesProps> = ({ record }) => {
  const nestedResourceFieldCount = record.nestedResourceFieldCount || 0;
  const hasFocusedCmdStructure = Boolean(record.cmdStructureFocusPaths?.length);

  return (
    <>
      <div data-tour="transform-report-record-badges" className="mt-1 flex flex-wrap gap-1">
        {record.labels.map((label, index) => (
          <span
            key={`${record.path}:${index}:${label}`}
            className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded"
          >
            {label}
          </span>
        ))}
        {record.nestedCommandFieldCount > 0 && (
          <span
            className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded"
            title="该展开结果内部包含的 CMD/Scheme 字段数量"
          >
            内部CMD字段 {record.nestedCommandFieldCount}
          </span>
        )}
        {nestedResourceFieldCount > 0 && (
          <span
            className="bg-slate-900/45 text-slate-100 border border-slate-700/60 px-2 py-0.5 rounded"
            title="该展开结果内部包含的静态素材资源字段数量"
          >
            资源URL {nestedResourceFieldCount}
          </span>
        )}
        {hasFocusedCmdStructure && (
          <span
            className="bg-emerald-950/40 text-emerald-200 border border-emerald-800/60 px-2 py-0.5 rounded"
            title={`复制 CMD 结构时会只保留当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}`}
          >
            聚焦复制
          </span>
        )}
      </div>
      {record.insights.length > 0 && (
        <div data-tour="transform-report-record-insights" className="mt-1 flex flex-wrap gap-1">
          {record.insights.map((insight, index) => (
            <span
              key={`${record.path}:insight:${index}:${insight}`}
              className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded font-mono"
              title={insight}
            >
              {insight}
            </span>
          ))}
        </div>
      )}
    </>
  );
};
