import React from 'react';
import type { TransformContextReport } from '../utils/transformSummary';

interface TransformReportTopDistributionsProps {
  report: TransformContextReport;
  onFilter: (query: string) => void;
}

export const TransformReportTopDistributions: React.FC<TransformReportTopDistributionsProps> = ({
  report,
  onFilter,
}) => (
  <>
    {Boolean(report.topCommandSchemaOrigins?.length) && (
      <div data-tour="transform-report-top-command-schema-origins" className="mt-2 text-xs">
        <div className="mb-1 text-gray-500">CMD 来源分布</div>
        <div className="flex flex-wrap gap-1.5">
          {report.topCommandSchemaOrigins?.map(group => (
            <button
              key={group.origin}
              type="button"
              onClick={() => onFilter(group.origin)}
              className="max-w-full rounded border border-teal-800/50 bg-teal-950/25 px-2 py-0.5 text-teal-100 transition-colors hover:bg-teal-900/45"
              title={`${group.origin} 出现 ${group.count} 次，覆盖 ${group.schemaCount} 个 Schema、${group.recordCount} 条展开记录。示例 Schema：${group.schemas.join('；')}`}
            >
              <span className="inline-block max-w-[180px] truncate align-bottom font-mono">
                {group.origin}
              </span>
              <span className="ml-1 text-teal-300/80">×{group.count}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {Boolean(report.topCommandSchemas?.length) && (
      <div data-tour="transform-report-top-command-schemas" className="mt-2 text-xs">
        <div className="mb-1 text-gray-500">CMD 跳转 Schema 分布</div>
        <div className="flex flex-wrap gap-1.5">
          {report.topCommandSchemas?.map(group => (
            <button
              key={group.schema}
              type="button"
              onClick={() => onFilter(group.schema)}
              className="max-w-full rounded border border-emerald-800/50 bg-emerald-950/25 px-2 py-0.5 text-emerald-100 transition-colors hover:bg-emerald-900/45"
              title={`${group.schema} 出现 ${group.count} 次，覆盖 ${group.recordCount} 条展开记录。示例路径：${group.paths.join('；')}`}
            >
              <span className="inline-block max-w-[220px] truncate align-bottom font-mono">
                {group.schema}
              </span>
              <span className="ml-1 text-emerald-300/80">×{group.count}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {Boolean(report.topResourceSchemas?.length) && (
      <div data-tour="transform-report-top-resource-schemas" className="mt-2 text-xs">
        {Boolean(report.topResourceTypes?.length) && (
          <div className="mb-2">
            <div className="mb-1 text-gray-500">静态资源类型分布</div>
            <div className="flex flex-wrap gap-1.5">
              {report.topResourceTypes?.map(group => (
                <button
                  key={group.resourceType}
                  type="button"
                  onClick={() => onFilter(group.query)}
                  className="max-w-full rounded border border-sky-800/50 bg-sky-950/25 px-2 py-0.5 text-sky-100 transition-colors hover:bg-sky-900/45"
                  title={`${group.resourceTypeLabel} 占 ${group.percentage}%，出现 ${group.count} 次，覆盖 ${group.schemaCount} 个 URL、${group.recordCount} 条展开记录。示例 URL：${group.schemas.join('；')}`}
                >
                  <span>{group.resourceTypeLabel}</span>
                  <span className="ml-1 text-sky-300/80">{group.percentage}%</span>
                  <span className="ml-1 text-sky-300/70">×{group.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mb-1 text-gray-500">静态资源 URL 分布</div>
        <div className="flex flex-wrap gap-1.5">
          {report.topResourceSchemas?.map(group => (
            <button
              key={group.schema}
              type="button"
              onClick={() => onFilter(group.schema)}
              className="max-w-full rounded border border-slate-700/60 bg-slate-900/40 px-2 py-0.5 text-slate-100 transition-colors hover:bg-slate-800/60"
              title={`${group.resourceTypeLabel ? `${group.resourceTypeLabel} · ` : ''}${group.schema} 出现 ${group.count} 次，覆盖 ${group.recordCount} 条展开记录。示例路径：${group.paths.join('；')}`}
            >
              {group.resourceTypeLabel && (
                <span className="mr-1 rounded bg-slate-800 px-1 py-px text-[10px] text-slate-300">
                  {group.resourceTypeLabel}
                </span>
              )}
              <span className="inline-block max-w-[220px] truncate align-bottom font-mono">
                {group.schema}
              </span>
              <span className="ml-1 text-slate-300/80">×{group.count}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {Boolean(report.topNestedCommandFields?.length) && (
      <div data-tour="transform-report-top-nested-cmd-fields" className="mt-2 text-xs">
        <div className="mb-1 text-gray-500">内部CMD字段分布</div>
        <div className="flex flex-wrap gap-1.5">
          {report.topNestedCommandFields?.map(group => (
            <button
              key={group.key}
              type="button"
              onClick={() => onFilter(group.key)}
              className="max-w-full rounded border border-cyan-800/50 bg-cyan-950/30 px-2 py-0.5 text-cyan-100 transition-colors hover:bg-cyan-900/50"
              title={`${group.key} 出现 ${group.count} 次，覆盖 ${group.recordCount} 条展开记录。示例路径：${group.paths.join('；')}`}
            >
              <span className="font-mono">{group.key}</span>
              <span className="ml-1 text-cyan-300/80">×{group.count}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {Boolean(report.topNestedResourceFields?.length) && (
      <div data-tour="transform-report-top-nested-resource-fields" className="mt-2 text-xs">
        <div className="mb-1 text-gray-500">静态资源字段分布</div>
        <div className="flex flex-wrap gap-1.5">
          {report.topNestedResourceFields?.map(group => (
            <button
              key={group.key}
              type="button"
              onClick={() => onFilter(group.key)}
              className="max-w-full rounded border border-slate-700/60 bg-slate-900/40 px-2 py-0.5 text-slate-100 transition-colors hover:bg-slate-800/60"
              title={`${group.key} 出现 ${group.count} 次，覆盖 ${group.recordCount} 条展开记录。示例路径：${group.paths.join('；')}`}
            >
              <span className="font-mono">{group.key}</span>
              <span className="ml-1 text-slate-300/80">×{group.count}</span>
            </button>
          ))}
        </div>
      </div>
    )}
  </>
);
