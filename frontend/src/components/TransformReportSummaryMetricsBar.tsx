import React from 'react';
import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';
import type { PlaceholderFillSummary } from '../utils/transformReportPlaceholderFillSummary';
import { SummaryMetricChip } from './TransformReportPanelAtoms';
import { getTransformReportSummaryFilterButtonItems } from './transformReportSummaryFilterButtonItems';
import {
  renderTransformReportSummaryFilterButton,
  renderTransformReportSummaryMetricButton,
} from './transformReportSummaryMetricButtons';

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
    {getTransformReportSummaryFilterButtonItems(report, issuePriorityCount).map(item => (
      <React.Fragment key={item.dataTour}>
        {renderTransformReportSummaryFilterButton({ ...item, onFilter })}
        {item.dataTour === 'transform-report-cmd-structure-count' && renderTransformReportSummaryMetricButton({
          dataTour: 'transform-report-open-first-cmd-comparison',
          title: '打开第一条 CMD 结构的 cmdHandler 对比',
          tone: 'teal',
          disabled: !reportView || reportView.filteredCmdStructureCount === 0 || isFilterPending,
          onClick: onOpenFirstCmdComparison,
          children: '对比cmdHandler',
        })}
      </React.Fragment>
    ))}
    {report.summary.placeholderCount > 0 && hasTemplateFillTarget && renderTransformReportSummaryMetricButton({
      dataTour: 'transform-report-open-placeholder-fill-shortcut',
      title: placeholderFillPanelTitle,
      tone: 'violetAction',
      disabled: !placeholderFillTemplateJsonText || isFilterPending,
      onClick: onOpenPlaceholderFillTemplate,
      children: <>回填占位符{placeholderFillTemplateSummary ? ` ${placeholderFillTemplateSummary.filled}/${placeholderFillTemplateSummary.total}` : ''}</>,
    })}
  </div>
);
