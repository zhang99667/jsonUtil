import React from 'react';
import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';
import type { PlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import { SummaryMetricChip } from './TransformReportPanelAtoms';

interface TransformReportSummaryMetricsBarProps {
  report: TransformContextReport;
  reportView: TransformReportView | null;
  issuePriorityCount: number;
  isFilterPending: boolean;
  hasTemplateFillTarget: boolean;
  placeholderFillTemplateJsonText: string;
  placeholderFillTemplateSummary: PlaceholderFillSummary | null;
  placeholderFillPanelTitle: string;
  onFilter: (query: string) => void;
  onOpenFirstCmdComparison: () => void;
  onOpenPlaceholderFillTemplate: () => void;
}

export const TransformReportSummaryMetricsBar: React.FC<TransformReportSummaryMetricsBarProps> = ({
  report,
  reportView,
  issuePriorityCount,
  isFilterPending,
  hasTemplateFillTarget,
  placeholderFillTemplateJsonText,
  placeholderFillTemplateSummary,
  placeholderFillPanelTitle,
  onFilter,
  onOpenFirstCmdComparison,
  onOpenPlaceholderFillTemplate,
}) => (
  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
    <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
      展开 {report.summary.recordCount}
    </span>
    <SummaryMetricChip
      label="CMD"
      count={report.summary.schemeCounts.queryString}
      query="CMD 参数"
      dataTour="transform-report-cmd-count"
      title="筛选 CMD 参数展开记录"
      onFilter={onFilter}
    />
    <SummaryMetricChip
      label="URL"
      count={report.summary.schemeCounts.url}
      query="URL Scheme"
      dataTour="transform-report-url-count"
      title="筛选 URL Scheme 展开记录"
      onFilter={onFilter}
    />
    <SummaryMetricChip
      label="Base64"
      count={report.summary.schemeCounts.base64}
      query="Base64"
      dataTour="transform-report-base64-count"
      title="筛选 Base64 展开记录"
      onFilter={onFilter}
    />
    {report.cmdStructureCount > 0 && (
      <>
        <button
          type="button"
          data-tour="transform-report-cmd-structure-count"
          onClick={() => onFilter('CMD结构')}
          className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded hover:bg-cyan-900/50 transition-colors"
          title="筛选可复制的 cmdHandler CMD 结构"
        >
          CMD结构 {report.cmdStructureCount}
        </button>
        <button
          type="button"
          data-tour="transform-report-open-first-cmd-comparison"
          onClick={onOpenFirstCmdComparison}
          disabled={!reportView || reportView.filteredCmdStructureCount === 0 || isFilterPending}
          className="bg-teal-950/40 text-teal-100 border border-teal-800/60 px-2 py-0.5 rounded hover:bg-teal-900/55 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          title="打开第一条 CMD 结构的 cmdHandler 对比"
        >
          对比cmdHandler
        </button>
      </>
    )}
    {report.nestedCommandFieldCount > 0 && (
      <button
        type="button"
        data-tour="transform-report-nested-cmd-count"
        onClick={() => onFilter('内部CMD字段')}
        className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded hover:bg-cyan-900/50 transition-colors"
        title="筛选包含内部 CMD/Scheme 字段的展开记录"
      >
        内部CMD {report.nestedCommandFieldCount}
      </button>
    )}
    {(report.nestedResourceFieldCount || 0) > 0 && (
      <button
        type="button"
        data-tour="transform-report-nested-resource-count"
        onClick={() => onFilter('资源URL')}
        className="bg-slate-900/45 text-slate-100 border border-slate-700/60 px-2 py-0.5 rounded hover:bg-slate-800/60 transition-colors"
        title="筛选包含静态素材资源 URL 的展开记录"
      >
        资源URL {report.nestedResourceFieldCount}
      </button>
    )}
    {issuePriorityCount > 0 && (
      <button
        type="button"
        data-tour="transform-report-issue-priority"
        onClick={() => onFilter('待处理')}
        className="bg-rose-950/35 text-rose-100 border border-rose-700/60 px-2 py-0.5 rounded hover:bg-rose-900/55 transition-colors"
        title="筛选待检查、跳过记录和运行时占位符"
      >
        待处理 {issuePriorityCount}
      </button>
    )}
    {report.summary.schemeCounts.nonReversible > 0 && (
      <button
        type="button"
        data-tour="transform-report-non-reversible-count"
        onClick={() => onFilter('不可逆')}
        className="bg-amber-900/30 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded hover:bg-amber-800/50 transition-colors"
        title="筛选不可逆解析记录"
      >
        不可逆 {report.summary.schemeCounts.nonReversible}
      </button>
    )}
    {report.summary.unresolvedCount > 0 && (
      <button
        type="button"
        data-tour="transform-report-unresolved-count"
        onClick={() => onFilter('待检查')}
        className="bg-sky-900/30 text-sky-200 border border-sky-700/50 px-2 py-0.5 rounded hover:bg-sky-800/50 transition-colors"
        title="筛选未展开线索"
      >
        待检查 {report.summary.unresolvedCount}
      </button>
    )}
    {report.summary.warningCount > 0 && (
      <button
        type="button"
        data-tour="transform-report-warning-count"
        onClick={() => onFilter('跳过')}
        className="bg-amber-900/30 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded hover:bg-amber-800/50 transition-colors"
        title="筛选性能保护跳过记录"
      >
        跳过 {report.summary.warningCount}
      </button>
    )}
    {report.summary.placeholderCount > 0 && (
      <>
        <button
          type="button"
          data-tour="transform-report-placeholder-count"
          onClick={() => onFilter('占位符')}
          className="bg-violet-900/30 text-violet-200 border border-violet-700/50 px-2 py-0.5 rounded hover:bg-violet-800/50 transition-colors"
          title="筛选运行时占位符"
        >
          占位符 {report.summary.placeholderCount}
        </button>
        {hasTemplateFillTarget && (
          <button
            type="button"
            data-tour="transform-report-open-placeholder-fill-shortcut"
            onClick={onOpenPlaceholderFillTemplate}
            disabled={!placeholderFillTemplateJsonText || isFilterPending}
            className="bg-violet-950/40 text-violet-100 border border-violet-700/60 px-2 py-0.5 rounded hover:bg-violet-900/55 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            title={placeholderFillPanelTitle}
          >
            回填占位符{placeholderFillTemplateSummary ? ` ${placeholderFillTemplateSummary.filled}/${placeholderFillTemplateSummary.total}` : ''}
          </button>
        )}
      </>
    )}
  </div>
);
