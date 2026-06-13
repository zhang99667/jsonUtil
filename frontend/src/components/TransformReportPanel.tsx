import React, { useDeferredValue, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { TransformContext } from '../types';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import {
  buildTransformContextReport,
  buildTransformReportView,
  formatTransformCmdStructureReportText,
  formatTransformCmdStructureComparisonPackageText,
  formatTransformContextReportText,
  formatTransformDiagnosticSummaryText,
  formatTransformIssueRegressionTemplateText,
  formatTransformIssueSampleJsonText,
  formatTransformIssueSampleReportText,
  formatTransformPathValueReportText,
  formatTransformPlaceholderFillTemplateJsonText,
  formatTransformPlaceholderReportText,
  formatTransformReportViewText,
  getTransformDecodedPathCopyText,
  getTransformPathValueCopyRows,
  getTransformRecordCmdStructureCopyText,
} from '../utils/transformSummary';
import type { TransformReportRecord } from '../utils/transformSummary';
import { DraggablePanel, PanelIcons } from './DraggablePanel';

interface TransformReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: TransformContext | null;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
  onOpenTemplateFill?: (template: string) => void;
}

const SourceLabelBadge: React.FC<{ label?: string }> = ({ label }) => (
  label ? (
    <span
      className="max-w-[120px] shrink-0 truncate rounded bg-cyan-900/40 px-2 py-0.5 text-cyan-200"
      title={label}
    >
      {label}
    </span>
  ) : null
);

const getCoverageClassName = (level: 'success' | 'info' | 'warning'): string => {
  if (level === 'success') return 'border-emerald-700/50 bg-emerald-900/20 text-emerald-100';
  if (level === 'warning') return 'border-amber-700/50 bg-amber-900/20 text-amber-100';
  return 'border-sky-700/50 bg-sky-900/20 text-sky-100';
};

const formatDecodedPathCount = (record: TransformReportRecord): string => (
  record.isDecodedPathCountTruncated ? `${record.decodedPathCount}+` : String(record.decodedPathCount)
);

const COMMAND_SCHEMA_ROW_DISPLAY_LIMIT = 8;

interface SummaryMetricChipProps {
  label: string;
  count: number;
  query: string;
  dataTour: string;
  title: string;
  onFilter: (query: string) => void;
}

const SummaryMetricChip: React.FC<SummaryMetricChipProps> = ({
  label,
  count,
  query,
  dataTour,
  title,
  onFilter,
}) => {
  const className = count > 0
    ? 'bg-editor-bg text-gray-300 px-2 py-0.5 rounded hover:bg-editor-active hover:text-cyan-100 transition-colors'
    : 'bg-editor-bg text-gray-300 px-2 py-0.5 rounded';

  if (count <= 0) {
    return (
      <span className={className}>
        {label} {count}
      </span>
    );
  }

  return (
    <button
      type="button"
      data-tour={dataTour}
      onClick={() => onFilter(query)}
      className={className}
      title={title}
    >
      {label} {count}
    </button>
  );
};

export const TransformReportPanel: React.FC<TransformReportPanelProps> = ({
  isOpen,
  onClose,
  context,
  onLocatePath,
  onOpenSchemeValue,
  onOpenTemplateFill,
}) => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isFilterPending = query !== deferredQuery;
  const report = useMemo(() => (
    context ? buildTransformContextReport(context) : null
  ), [context]);
  const reportView = useMemo(() => (
    report ? buildTransformReportView(report, deferredQuery) : null
  ), [report, deferredQuery]);
  const hasPathValueCopyItems = useMemo(() => (
    Boolean(reportView?.records.some(record => (
      getTransformPathValueCopyRows(record).length > 0
    )))
  ), [reportView]);
  const hasCmdStructureCopyItems = useMemo(() => (
    Boolean(reportView && reportView.filteredCmdStructureCount > 0)
  ), [reportView]);
  const hasFocusedCmdStructureCopyItems = useMemo(() => (
    Boolean(reportView?.cmdStructureRecords.some(record => record.cmdStructureFocusPaths?.length))
  ), [reportView]);
  const issueSampleCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleReportText(reportView) : ''
  ), [reportView]);
  const issueSampleJsonCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleJsonText(reportView) : ''
  ), [reportView]);
  const redactedIssueSampleJsonCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleJsonText(reportView, { redactSensitiveValues: true }) : ''
  ), [reportView]);
  const issueRegressionTemplateCopyText = useMemo(() => (
    reportView ? formatTransformIssueRegressionTemplateText(reportView, { redactSensitiveValues: true }) : ''
  ), [reportView]);
  const placeholderFillTemplateJsonText = useMemo(() => (
    reportView ? formatTransformPlaceholderFillTemplateJsonText(reportView) : ''
  ), [reportView]);

  const showCopyError = (message: string, error: unknown) => {
    console.warn(message, error);
    toast.error(getClipboardErrorMessage(error), { duration: 2000 });
  };

  const handleCopyReport = async () => {
    if (!context) return;

    try {
      await copyText(formatTransformContextReportText(context));
      toast.success('已复制解析报告', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析报告失败:', error);
    }
  };

  const handleCopyFilteredReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      await copyText(formatTransformReportViewText(report, reportView, deferredQuery));
      toast.success('已复制筛选结果', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析筛选结果失败:', error);
    }
  };

  const handleCopyDiagnosticSummary = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      await copyText(formatTransformDiagnosticSummaryText(report, reportView, deferredQuery));
      toast.success('已复制诊断摘要', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析诊断摘要失败:', error);
    }
  };

  const handleCopyPathValueReport = async () => {
    if (!reportView || !hasPathValueCopyItems || isFilterPending) return;

    try {
      const pathValueCopyText = formatTransformPathValueReportText(reportView);
      if (!pathValueCopyText) return;

      await copyText(pathValueCopyText);
      toast.success('已复制路径和值', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析路径和值失败:', error);
    }
  };

  const handleCopyCmdStructureReport = async () => {
    if (!report || !reportView || !hasCmdStructureCopyItems || isFilterPending) return;

    try {
      const cmdStructureCopyText = formatTransformCmdStructureReportText(report, reportView, deferredQuery);
      if (!cmdStructureCopyText) return;

      await copyText(cmdStructureCopyText);
      toast.success(hasFocusedCmdStructureCopyItems ? '已复制聚焦 CMD 结构列表' : '已复制 CMD 结构列表', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 结构列表失败:', error);
    }
  };

  const handleCopyPlaceholderReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      await copyText(formatTransformPlaceholderReportText(report, reportView, deferredQuery));
      toast.success(deferredQuery.trim() ? '已复制筛选占位符' : '已复制占位符摘要', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析占位符失败:', error);
    }
  };

  const handleCopyPlaceholderFillTemplate = async () => {
    if (!placeholderFillTemplateJsonText || isFilterPending) return;

    try {
      await copyText(placeholderFillTemplateJsonText);
      toast.success('已复制占位符回填模板', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析占位符回填模板失败:', error);
    }
  };

  const handleOpenPlaceholderFillTemplate = () => {
    if (!placeholderFillTemplateJsonText || isFilterPending || !onOpenTemplateFill) return;

    onOpenTemplateFill(placeholderFillTemplateJsonText);
    toast.success('已填入模板填充', { duration: 1600 });
  };

  const handleCopyIssueSamples = async () => {
    if (!issueSampleCopyText || isFilterPending) return;

    try {
      await copyText(issueSampleCopyText);
      toast.success('已复制问题样本', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析问题样本失败:', error);
    }
  };

  const handleCopyIssueSampleJson = async () => {
    if (!issueSampleJsonCopyText || isFilterPending) return;

    try {
      await copyText(issueSampleJsonCopyText);
      toast.success('已复制样本 JSON', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析样本 JSON 失败:', error);
    }
  };

  const handleCopyRedactedIssueSampleJson = async () => {
    if (!redactedIssueSampleJsonCopyText || isFilterPending) return;

    try {
      await copyText(redactedIssueSampleJsonCopyText);
      toast.success('已复制脱敏样本 JSON', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析脱敏样本 JSON 失败:', error);
    }
  };

  const handleCopyIssueRegressionTemplate = async () => {
    if (!issueRegressionTemplateCopyText || isFilterPending) return;

    try {
      await copyText(issueRegressionTemplateCopyText);
      toast.success('已复制回归模板', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析回归模板失败:', error);
    }
  };

  const handleCopyPath = async (path: string, successMessage = '已复制路径') => {
    try {
      await copyText(path);
      toast.success(successMessage, { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析路径失败:', error);
    }
  };

  const handleCopyOriginalValue = async (value: string, successMessage = '已复制原始值') => {
    try {
      await copyText(value);
      toast.success(successMessage, { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析原始值失败:', error);
    }
  };

  const handleCopyDecodedPathValue = async (value: string) => {
    try {
      await copyText(value);
      toast.success('已复制路径和值', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析内部路径和值失败:', error);
    }
  };

  const handleCopyCmdStructure = async (record: TransformReportRecord) => {
    try {
      const cmdStructureCopyText = getTransformRecordCmdStructureCopyText(record);
      if (!cmdStructureCopyText) return;

      await copyText(cmdStructureCopyText);
      toast.success(record.cmdStructureFocusPaths?.length ? '已复制聚焦 CMD 结构' : '已复制 CMD 结构', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 结构失败:', error);
    }
  };

  const handleCopyCmdComparisonPackage = async (record: TransformReportRecord) => {
    try {
      const comparisonPackageText = formatTransformCmdStructureComparisonPackageText(record);
      if (!comparisonPackageText) return;

      await copyText(comparisonPackageText);
      toast.success('已复制 CMD 对比包', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 对比包失败:', error);
    }
  };

  const handleLocatePath = (path: string) => {
    if (!onLocatePath) return;

    onLocatePath(path);
    toast.success('已填入 JSONPath 查询', { duration: 1600 });
  };

  const handleOpenSchemeValue = (value: string) => {
    if (!onOpenSchemeValue) return;

    onOpenSchemeValue(value);
    toast.success('已填入 Scheme 解析', { duration: 1600 });
  };

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="min-w-[220px] flex-1 text-xs text-gray-500">
        {report
          ? `${reportView?.filteredRecordCount || 0}/${reportView?.totalRecordCount || 0} 条展开记录 · ${reportView?.filteredCmdStructureCount || 0}/${reportView?.totalCmdStructureCount || 0} 条CMD结构 · ${reportView?.filteredNestedCommandFieldCount || 0}/${reportView?.totalNestedCommandFieldCount || 0} 个内部CMD字段 · ${reportView?.filteredPlaceholderCount || 0}/${reportView?.totalPlaceholderCount || 0} 个占位符 · ${reportView?.filteredUnresolvedCount || 0}/${reportView?.totalUnresolvedCount || 0} 条待检查 · ${reportView?.filteredWarningCount || 0}/${reportView?.totalWarningCount || 0} 条跳过记录`
          : '暂无解析上下文'}
      </div>
      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
        {query.trim() && (
          <button
            onClick={handleCopyFilteredReport}
            disabled={!reportView || isFilterPending}
            className="whitespace-nowrap px-2.5 py-1 text-sm bg-cyan-900/40 text-cyan-100 rounded hover:bg-cyan-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            复制筛选结果
          </button>
        )}
        <button
          data-tour="transform-report-copy-diagnostic-summary"
          onClick={handleCopyDiagnosticSummary}
          disabled={!reportView || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="复制不含原始大字段值的解析覆盖、CMD Schema 和风险摘要"
        >
          复制诊断摘要
        </button>
        <button
          data-tour="transform-report-copy-path-values"
          onClick={handleCopyPathValueReport}
          disabled={!hasPathValueCopyItems || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="复制当前筛选下已索引的内部路径和值"
        >
          复制路径值
        </button>
        {hasCmdStructureCopyItems && (
          <button
            data-tour="transform-report-copy-cmd-structures"
            onClick={handleCopyCmdStructureReport}
            disabled={isFilterPending}
            className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="复制当前展示的 cmdHandler 风格 CMD 结构"
          >
            {hasFocusedCmdStructureCopyItems ? '复制聚焦 CMD' : '复制 CMD 结构'}
          </button>
        )}
        <button
          data-tour="transform-report-copy-issue-samples"
          onClick={handleCopyIssueSamples}
          disabled={!issueSampleCopyText || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="复制当前筛选下的待检查、跳过和占位符来源样本"
        >
          复制问题样本
        </button>
        <button
          data-tour="transform-report-copy-issue-sample-json"
          onClick={handleCopyIssueSampleJson}
          disabled={!issueSampleJsonCopyText || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="复制当前筛选下可沉淀为回归用例的结构化样本 JSON"
        >
          复制样本 JSON
        </button>
        <button
          data-tour="transform-report-copy-redacted-issue-sample-json"
          onClick={handleCopyRedactedIssueSampleJson}
          disabled={!redactedIssueSampleJsonCopyText || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="复制当前筛选下的脱敏结构化样本 JSON，便于安全沉淀回归用例"
        >
          复制脱敏 JSON
        </button>
        <button
          data-tour="transform-report-copy-issue-regression-template"
          onClick={handleCopyIssueRegressionTemplate}
          disabled={!issueRegressionTemplateCopyText || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="复制当前筛选下的脱敏 Vitest TODO 回归模板"
        >
          复制回归模板
        </button>
        <button
          onClick={handleCopyReport}
          disabled={!context}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          复制报告
        </button>
      </div>
    </div>
  );

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="深度解析报告"
      icon={PanelIcons.Code}
      storageKey="transform-report-panel"
      defaultPosition={{ x: 220, y: 120 }}
      defaultSize={{ width: 680, height: 520 }}
      minSize={{ width: 480, height: 320 }}
      footer={footer}
      dataTour="transform-report-panel"
    >
      <div className="flex-1 min-h-0 overflow-y-auto bg-editor-bg p-3">
        {!report ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            暂无深度解析上下文
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded border border-editor-border bg-editor-sidebar px-3 py-2">
              <div className="text-xs text-cyan-200">{report.summaryText || '深度解析: 无展开记录'}</div>
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
                  onFilter={setQuery}
                />
                <SummaryMetricChip
                  label="URL"
                  count={report.summary.schemeCounts.url}
                  query="URL Scheme"
                  dataTour="transform-report-url-count"
                  title="筛选 URL Scheme 展开记录"
                  onFilter={setQuery}
                />
                <SummaryMetricChip
                  label="Base64"
                  count={report.summary.schemeCounts.base64}
                  query="Base64"
                  dataTour="transform-report-base64-count"
                  title="筛选 Base64 展开记录"
                  onFilter={setQuery}
                />
                {report.cmdStructureCount > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-cmd-structure-count"
                    onClick={() => setQuery('CMD结构')}
                    className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded hover:bg-cyan-900/50 transition-colors"
                    title="筛选可复制的 cmdHandler CMD 结构"
                  >
                    CMD结构 {report.cmdStructureCount}
                  </button>
                )}
                {report.nestedCommandFieldCount > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-nested-cmd-count"
                    onClick={() => setQuery('内部CMD字段')}
                    className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded hover:bg-cyan-900/50 transition-colors"
                    title="筛选包含内部 CMD/Scheme 字段的展开记录"
                  >
                    内部CMD {report.nestedCommandFieldCount}
                  </button>
                )}
                {report.summary.schemeCounts.nonReversible > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-non-reversible-count"
                    onClick={() => setQuery('不可逆')}
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
                    onClick={() => setQuery('待检查')}
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
                    onClick={() => setQuery('跳过')}
                    className="bg-amber-900/30 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded hover:bg-amber-800/50 transition-colors"
                    title="筛选性能保护跳过记录"
                  >
                    跳过 {report.summary.warningCount}
                  </button>
                )}
                {report.summary.placeholderCount > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-placeholder-count"
                    onClick={() => setQuery('占位符')}
                    className="bg-violet-900/30 text-violet-200 border border-violet-700/50 px-2 py-0.5 rounded hover:bg-violet-800/50 transition-colors"
                    title="筛选运行时占位符"
                  >
                    占位符 {report.summary.placeholderCount}
                  </button>
                )}
              </div>
              <div
                data-tour="transform-report-coverage"
                className={`mt-2 rounded border px-2 py-1.5 text-xs ${getCoverageClassName(report.coverage.level)}`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{report.coverage.label}</span>
                  <span className="text-current/80">{report.coverage.description}</span>
                </div>
                {report.coverage.items.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {report.coverage.items.map(item => (
                      <span
                        key={item}
                        className="rounded bg-editor-bg/70 px-2 py-0.5 text-current/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {Boolean(report.topCommandSchemaOrigins?.length) && (
                <div data-tour="transform-report-top-command-schema-origins" className="mt-2 text-xs">
                  <div className="mb-1 text-gray-500">CMD 来源分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topCommandSchemaOrigins?.map(group => (
                      <button
                        key={group.origin}
                        type="button"
                        onClick={() => setQuery(group.origin)}
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
                  <div className="mb-1 text-gray-500">CMD Schema 分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topCommandSchemas?.map(group => (
                      <button
                        key={group.schema}
                        type="button"
                        onClick={() => setQuery(group.schema)}
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
              {Boolean(report.topNestedCommandFields?.length) && (
                <div data-tour="transform-report-top-nested-cmd-fields" className="mt-2 text-xs">
                  <div className="mb-1 text-gray-500">内部CMD字段分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topNestedCommandFields?.map(group => (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => setQuery(group.key)}
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
            </div>

            <div className="flex items-center gap-2">
              <input
                data-tour="transform-report-filter"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="筛选路径、类型、原始值、解析结果或占位符..."
                className="flex-1 min-w-0 bg-editor-sidebar text-gray-200 text-xs px-3 py-1.5 rounded border border-editor-border focus:border-cyan-600 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="shrink-0 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  清空
                </button>
              )}
              {isFilterPending && (
                <span className="shrink-0 text-xs text-cyan-400">
                  更新中...
                </span>
              )}
            </div>

            {reportView && reportView.filteredRecordCount > 0 && (
              <div data-tour="transform-report-records" className="flex flex-col gap-1.5">
                <div className="text-xs text-gray-500 font-medium">
                  展开记录 · {reportView.filteredRecordCount}
                  {reportView.isRecordTruncated && (
                    <span className="text-amber-300 ml-2">仅显示前 {reportView.records.length} 条</span>
                  )}
                </div>
                {reportView.records.map(record => (
                  <div
                    key={record.path}
                    data-tour="transform-report-row"
                    className="rounded border border-editor-border bg-editor-sidebar px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <SourceLabelBadge label={record.sourceLabel} />
                        <span className="font-mono text-emerald-300 truncate" title={record.path}>
                          {record.path}
                        </span>
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        {record.hasNonReversibleScheme && (
                          <span className="text-amber-200 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
                            不可逆
                          </span>
                        )}
                        <button
                          type="button"
                          data-tour="transform-report-copy-path"
                          onClick={() => handleCopyPath(record.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
                        </button>
                        <button
                          type="button"
                          data-tour="transform-report-copy-original-value"
                          onClick={() => handleCopyOriginalValue(record.originalValue)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制原始值
                        </button>
                        {record.hasCmdStructure && (
                          <>
                            <button
                              type="button"
                              data-tour="transform-report-copy-cmd-structure"
                              onClick={() => handleCopyCmdStructure(record)}
                              className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                              title={record.cmdStructureFocusPaths?.length
                                ? `复制按当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}裁剪后的 cmdParams`
                                : '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构'}
                            >
                              {record.cmdStructureFocusPaths?.length ? '复制聚焦 CMD' : '复制 CMD 结构'}
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-copy-cmd-comparison-package"
                              onClick={() => handleCopyCmdComparisonPackage(record)}
                              className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                              title="复制可直接用于 cmd:diff -- --stdin 的 actual/expected 对比包"
                            >
                              复制对比包
                            </button>
                          </>
                        )}
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-path"
                            onClick={() => handleLocatePath(record.path)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位
                          </button>
                        )}
                        {onOpenSchemeValue && (
                          <button
                            type="button"
                            data-tour="transform-report-open-scheme"
                            onClick={() => handleOpenSchemeValue(record.originalValue)}
                            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            Scheme 打开
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
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
                      {record.cmdStructureFocusPaths?.length && (
                        <span
                          className="bg-emerald-950/40 text-emerald-200 border border-emerald-800/60 px-2 py-0.5 rounded"
                          title={`复制 CMD 结构时会只保留当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}`}
                        >
                          聚焦复制
                        </span>
                      )}
                    </div>
                    {record.insights.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
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
                    {record.hasCmdStructure && record.commandParamCount !== undefined && (
                      <div data-tour="transform-report-cmd-handler-summary" className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
                        <span className="rounded bg-emerald-950/40 px-2 py-0.5 text-emerald-200 border border-emerald-800/50">
                          cmdHandler
                        </span>
                        {record.commandSchema && (
                          <button
                            type="button"
                            data-tour="transform-report-filter-command-schema"
                            onClick={() => setQuery(record.commandSchema || '')}
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
                            onClick={() => setQuery(key)}
                            className="rounded bg-emerald-950/25 px-2 py-0.5 font-mono text-emerald-100 transition-colors hover:bg-emerald-900/45"
                            title={`筛选 cmdParams.${key}`}
                          >
                            {key}
                          </button>
                        ))}
                        {(record.commandParamKeys?.length || 0) < record.commandParamCount && (
                          <span className="rounded bg-editor-bg px-2 py-0.5 text-gray-500">
                            +{record.commandParamCount - (record.commandParamKeys?.length || 0)}
                          </span>
                        )}
                      </div>
                    )}
                    {record.commandSchemaRows?.length && (
                      <div data-tour="transform-report-command-schema-rows" className="mt-1.5 flex flex-col gap-1">
                        <div className="text-gray-500">
                          CMD Schema路径 · 显示 {Math.min(record.commandSchemaRows.length, COMMAND_SCHEMA_ROW_DISPLAY_LIMIT)}/{record.commandSchemaRows.length} 条
                        </div>
                        {record.commandSchemaRows.slice(0, COMMAND_SCHEMA_ROW_DISPLAY_LIMIT).map(row => (
                          <div
                            key={`${record.path}:cmd-schema:${row.path}:${row.schema}`}
                            data-tour="transform-report-command-schema-row"
                            className="flex items-center justify-between gap-2 rounded bg-emerald-950/20 px-2 py-1"
                          >
                            <div className="min-w-0 flex items-center gap-1 font-mono overflow-hidden">
                              <span className="min-w-0 flex-1 text-emerald-200 truncate" title={row.path}>
                                {row.path}
                              </span>
                              <span className="shrink-0 text-gray-500">=</span>
                              <span className="min-w-0 flex-1 text-teal-200 truncate" title={row.schema}>
                                {row.schema}
                              </span>
                            </div>
                            <button
                              type="button"
                              data-tour="transform-report-copy-command-schema-path"
                              onClick={() => handleCopyPath(row.path)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制路径
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-copy-command-schema-row"
                              onClick={() => handleCopyDecodedPathValue(`${row.path} = ${JSON.stringify(row.schema)}`)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制片段
                            </button>
                            {onLocatePath && (
                              <button
                                type="button"
                                data-tour="transform-report-locate-command-schema-path"
                                onClick={() => handleLocatePath(row.path)}
                                className="shrink-0 text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                              >
                                定位
                              </button>
                            )}
                          </div>
                        ))}
                        {record.commandSchemaRows.length > COMMAND_SCHEMA_ROW_DISPLAY_LIMIT && (
                          <div className="text-gray-500">
                            还有更多 CMD Schema 路径未展示，可搜索 schema 或来源展示隐藏项
                          </div>
                        )}
                      </div>
                    )}
                    {record.nestedCommandFields.length > 0 && (
                      <div data-tour="transform-report-nested-cmd-fields" className="mt-1.5 flex flex-col gap-1">
                        <div className="text-gray-500">
                          内部CMD字段 · 显示 {record.nestedCommandFields.length}/{record.nestedCommandFieldCount} 个
                        </div>
                        {record.nestedCommandFields.map(row => (
                          <div
                            key={`${record.path}:cmd-field:${row.path}`}
                            data-tour="transform-report-nested-cmd-field"
                            className="flex items-center justify-between gap-2 rounded bg-cyan-950/20 px-2 py-1"
                          >
                            <div className="min-w-0 flex items-center gap-1 font-mono overflow-hidden">
                              <span className="min-w-0 flex-1 text-emerald-200 truncate" title={row.path}>
                                {row.path}
                              </span>
                              <span className="shrink-0 text-gray-500">=</span>
                              <span className="min-w-0 flex-1 text-cyan-200 truncate" title={row.preview}>
                                {row.preview}
                              </span>
                            </div>
                            <button
                              type="button"
                              data-tour="transform-report-copy-nested-cmd-path"
                              onClick={() => handleCopyPath(row.path)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制路径
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-copy-nested-cmd-value"
                              onClick={() => handleCopyDecodedPathValue(getTransformDecodedPathCopyText(row))}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制片段
                            </button>
                            {onLocatePath && (
                              <button
                                type="button"
                                data-tour="transform-report-locate-nested-cmd-path"
                                onClick={() => handleLocatePath(row.path)}
                                className="shrink-0 text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                              >
                                定位
                              </button>
                            )}
                          </div>
                        ))}
                        {record.hasMoreNestedCommandFields && (
                          <div className="text-gray-500">
                            还有更多内部 CMD 字段未展示
                            {record.indexedNestedCommandFieldCount > record.nestedCommandFields.length && (
                              <span>
                                ，已索引 {record.indexedNestedCommandFieldCount} 个，可搜索字段名或 schema 展示隐藏项
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {record.decodedPreview && (
                      <div className="mt-1 font-mono text-cyan-200 truncate" title={record.decodedPreview}>
                        解析结果: {record.decodedPreview}
                      </div>
                    )}
                    {record.decodedPaths.length > 0 && (
                      <div className="mt-1.5 flex flex-col gap-1">
                        <div className="text-gray-500">
                          内部路径 · 显示 {record.decodedPaths.length}/{formatDecodedPathCount(record)} 条
                        </div>
                        {record.decodedPaths.map(row => (
                          <div
                            key={`${record.path}:${row.path}`}
                            data-tour="transform-report-decoded-path"
                            className="flex items-center justify-between gap-2 rounded bg-editor-bg px-2 py-1"
                          >
                            <div className="min-w-0 flex items-center gap-1 font-mono overflow-hidden">
                              <span className="min-w-0 flex-1 text-emerald-200 truncate" title={row.path}>
                                {row.path}
                              </span>
                              <span className="shrink-0 text-gray-500">=</span>
                              <span className="min-w-0 flex-1 text-cyan-200 truncate" title={row.preview}>
                                {row.preview}
                              </span>
                            </div>
                            <button
                              type="button"
                              data-tour="transform-report-copy-decoded-path"
                              onClick={() => handleCopyPath(row.path)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制路径
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-copy-decoded-value"
                              onClick={() => handleCopyDecodedPathValue(getTransformDecodedPathCopyText(row))}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制片段
                            </button>
                            {onLocatePath && (
                              <button
                                type="button"
                                data-tour="transform-report-locate-decoded-path"
                                onClick={() => handleLocatePath(row.path)}
                                className="shrink-0 text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                              >
                                定位
                              </button>
                            )}
                          </div>
                        ))}
                        {record.hasMoreDecodedPaths && (
                          <div data-tour="transform-report-more-decoded-paths" className="text-gray-500">
                            还有更多内部路径未展示，总计 {formatDecodedPathCount(record)} 条
                            {record.indexedDecodedPathCount > record.decodedPaths.length && (
                              <span>
                                ，已索引 {record.indexedDecodedPathCount} 条，可搜索字段名展示隐藏路径
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-1 font-mono text-gray-500 truncate" title={record.originalPreview}>
                      原始值: {record.originalPreview}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportView && reportView.filteredUnresolvedCount > 0 && (
              <div data-tour="transform-report-unresolved" className="flex flex-col gap-1.5">
                <div className="text-xs text-gray-500 font-medium">
                  未展开线索 · {reportView.filteredUnresolvedCount}
                  {reportView.isUnresolvedTruncated && (
                    <span className="text-amber-300 ml-2">仅显示前 {reportView.unresolvedCandidates.length} 条</span>
                  )}
                </div>
                {reportView.unresolvedCandidates.map(candidate => (
                  <div
                    key={`${candidate.path}:${candidate.length}:${candidate.detectedType || ''}`}
                    className="rounded border border-sky-700/50 bg-sky-900/20 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <SourceLabelBadge label={candidate.sourceLabel} />
                        <span className="font-mono text-sky-200 truncate" title={candidate.path}>
                          {candidate.path}
                        </span>
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        {candidate.detectedType && (
                          <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                            {candidate.detectedType}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyPath(candidate.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
                        </button>
                        <button
                          type="button"
                          data-tour="transform-report-copy-unresolved-value"
                          onClick={() => handleCopyOriginalValue(candidate.originalValue)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制原始值
                        </button>
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-unresolved-path"
                            onClick={() => handleLocatePath(candidate.path)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位
                          </button>
                        )}
                        {onOpenSchemeValue && (
                          <button
                            type="button"
                            data-tour="transform-report-open-unresolved-scheme"
                            onClick={() => handleOpenSchemeValue(candidate.originalValue)}
                            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            Scheme 打开
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span
                        className={`rounded border px-2 py-0.5 ${
                          candidate.reasonLevel === 'warning'
                            ? 'border-amber-700/50 bg-amber-900/30 text-amber-200'
                            : 'border-sky-700/50 bg-sky-950/40 text-sky-200'
                        }`}
                      >
                        {candidate.reasonLabel}
                      </span>
                      <span className="text-gray-300">{candidate.message}</span>
                    </div>
                    <div className="mt-1 text-gray-400">
                      下一步: {candidate.nextAction}
                    </div>
                    <div className="mt-1 font-mono text-gray-500 truncate" title={candidate.preview}>
                      预览: {candidate.preview}
                    </div>
                    <div className="mt-1 text-gray-500">
                      {candidate.length} 字符
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportView && reportView.filteredPlaceholderCount > 0 && (
              <div data-tour="transform-report-placeholders" className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500 font-medium">
                    运行时占位符 · {reportView.filteredPlaceholderCount}
                    {reportView.isPlaceholderTruncated && (
                      <span className="text-amber-300 ml-2">仅显示前 {reportView.runtimePlaceholders.length} 条</span>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                    {onOpenTemplateFill && (
                      <button
                        type="button"
                        data-tour="transform-report-open-placeholder-fill-template"
                        onClick={handleOpenPlaceholderFillTemplate}
                        disabled={!placeholderFillTemplateJsonText || isFilterPending}
                        className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        填入模板填充
                      </button>
                    )}
                    <button
                      type="button"
                      data-tour="transform-report-copy-placeholder-fill-template"
                      onClick={handleCopyPlaceholderFillTemplate}
                      disabled={!placeholderFillTemplateJsonText || isFilterPending}
                      className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      复制回填模板
                    </button>
                    <button
                      type="button"
                      data-tour="transform-report-copy-placeholders"
                      onClick={handleCopyPlaceholderReport}
                      disabled={isFilterPending}
                      className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      复制占位符
                    </button>
                  </div>
                </div>
                <div data-tour="transform-report-placeholder-groups" className="grid gap-1.5">
                  {reportView.runtimePlaceholderGroups.map(group => (
                    <div
                      key={group.value}
                      className="rounded border border-violet-700/50 bg-violet-950/30 px-3 py-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          data-tour="transform-report-filter-placeholder-group"
                          onClick={() => setQuery(group.value)}
                          className="font-mono text-violet-100 hover:text-violet-50 underline decoration-violet-500/50 underline-offset-2 transition-colors"
                          title="按该占位符筛选报告"
                        >
                          {group.value}
                        </button>
                        <span className="rounded bg-editor-bg px-2 py-0.5 text-violet-200">
                          {group.count} 处
                        </span>
                        <span className="rounded bg-editor-bg px-2 py-0.5 text-gray-300">
                          {group.sourceCount} 个来源
                        </span>
                      </div>
                      <div className="mt-1 text-gray-300">{group.description}</div>
                      <div className="mt-1 flex flex-col gap-1">
                        {group.sources.slice(0, 3).map(source => (
                          <div
                            key={`${group.value}:${source.sourcePath}`}
                            className="min-w-0 font-mono text-gray-500 truncate"
                            title={source.sourceOriginalPreview || source.sourcePath}
                          >
                            来源{source.sourceLabel ? ` ${source.sourceLabel}` : ''} ×{source.count}: {source.sourcePath}
                          </div>
                        ))}
                        {group.sources.length > 3 && (
                          <div className="text-gray-500">
                            还有 {group.sources.length - 3} 个来源
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {reportView.runtimePlaceholders.map(placeholder => (
                  <div
                    key={`${placeholder.path}:${placeholder.value}`}
                    className="rounded border border-violet-700/50 bg-violet-900/20 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <SourceLabelBadge label={placeholder.sourceLabel} />
                        <span className="font-mono text-violet-200 truncate" title={placeholder.path}>
                          {placeholder.path}
                        </span>
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                          {placeholder.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPath(placeholder.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
                        </button>
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-placeholder-path"
                            onClick={() => handleLocatePath(placeholder.path)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位
                          </button>
                        )}
                        <button
                          type="button"
                          data-tour="transform-report-copy-placeholder-source-path"
                          onClick={() => handleCopyPath(placeholder.sourcePath, '已复制来源路径')}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制来源
                        </button>
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-placeholder-source"
                            onClick={() => handleLocatePath(placeholder.sourcePath)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位来源
                          </button>
                        )}
                        {placeholder.sourceOriginalValue && (
                          <button
                            type="button"
                            data-tour="transform-report-copy-placeholder-source-value"
                            onClick={() => handleCopyOriginalValue(placeholder.sourceOriginalValue || '', '已复制来源值')}
                            className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            复制来源值
                          </button>
                        )}
                        {onOpenSchemeValue && placeholder.sourceOriginalValue && (
                          <button
                            type="button"
                            data-tour="transform-report-open-placeholder-source-scheme"
                            onClick={() => handleOpenSchemeValue(placeholder.sourceOriginalValue || '')}
                            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            Scheme 打开来源
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-gray-300">{placeholder.description}</div>
                    <div className="mt-1 font-mono text-gray-500 truncate" title={placeholder.sourcePath}>
                      来源: {placeholder.sourcePath}
                    </div>
                    {placeholder.sourceOriginalPreview && (
                      <div
                        className="mt-1 font-mono text-gray-500 truncate"
                        title={placeholder.sourceOriginalPreview}
                      >
                        来源原始值: {placeholder.sourceOriginalPreview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {reportView && reportView.filteredWarningCount > 0 && (
              <div data-tour="transform-report-warnings" className="flex flex-col gap-1.5">
                <div className="text-xs text-gray-500 font-medium">
                  跳过记录 · {reportView.filteredWarningCount}
                  {reportView.isWarningTruncated && (
                    <span className="text-amber-300 ml-2">仅显示前 {reportView.warnings.length} 条</span>
                  )}
                </div>
                {reportView.warnings.map(warning => (
                  <div
                    key={`${warning.path}:${warning.length}:${warning.limit}`}
                    className="rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <SourceLabelBadge label={warning.sourceLabel} />
                        <span className="font-mono text-amber-200 truncate" title={warning.path}>
                          {warning.path}
                        </span>
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          data-tour="transform-report-warning-copy-path"
                          onClick={() => handleCopyPath(warning.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
                        </button>
                        <button
                          type="button"
                          data-tour="transform-report-warning-copy-value"
                          onClick={() => handleCopyOriginalValue(warning.originalValue)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制原始值
                        </button>
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-warning-path"
                            onClick={() => handleLocatePath(warning.path)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位
                          </button>
                        )}
                        {onOpenSchemeValue && (
                          <button
                            type="button"
                            data-tour="transform-report-open-warning-scheme"
                            onClick={() => handleOpenSchemeValue(warning.originalValue)}
                            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            Scheme 打开
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="rounded border border-amber-700/50 bg-amber-900/30 px-2 py-0.5 text-amber-200">
                        {warning.reasonLabel}
                      </span>
                      <span className="text-gray-300">{warning.message}</span>
                    </div>
                    <div className="mt-1 text-gray-400">
                      下一步: {warning.nextAction}
                    </div>
                    <div className="mt-1 text-gray-500">
                      {warning.length} 字符，阈值 {warning.limit}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportView &&
              reportView.filteredRecordCount === 0 &&
              reportView.filteredPlaceholderCount === 0 &&
              reportView.filteredUnresolvedCount === 0 &&
              reportView.filteredWarningCount === 0 && (
              <div
                data-tour="transform-report-empty"
                className="rounded border border-editor-border bg-editor-sidebar p-4 text-center text-xs text-gray-500"
              >
                <div>{query ? '没有匹配的解析记录' : '本次深度格式化没有展开嵌套字符串'}</div>
                {query && (
                  <button
                    type="button"
                    data-tour="transform-report-empty-clear"
                    onClick={() => setQuery('')}
                    className="mt-2 rounded border border-editor-border bg-editor-bg px-2.5 py-1 text-gray-300 transition-colors hover:border-cyan-700 hover:text-cyan-100"
                  >
                    清空筛选
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DraggablePanel>
  );
};
