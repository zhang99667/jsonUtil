import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { TransformContext } from '../types';
import { copyText } from '../utils/clipboard';
import {
  buildTransformContextReport,
  buildTransformReportView,
  formatTransformContextReportText,
} from '../utils/transformSummary';
import { DraggablePanel, PanelIcons } from './DraggablePanel';

interface TransformReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: TransformContext | null;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
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

export const TransformReportPanel: React.FC<TransformReportPanelProps> = ({
  isOpen,
  onClose,
  context,
  onLocatePath,
  onOpenSchemeValue,
}) => {
  const [query, setQuery] = useState('');
  const report = useMemo(() => (
    context ? buildTransformContextReport(context) : null
  ), [context]);
  const reportView = useMemo(() => (
    report ? buildTransformReportView(report, query) : null
  ), [report, query]);

  const handleCopyReport = async () => {
    if (!context) return;

    try {
      await copyText(formatTransformContextReportText(context));
      toast.success('已复制解析报告', { duration: 2000 });
    } catch (error) {
      console.warn('复制深度解析报告失败:', error);
      toast.error('复制失败', { duration: 2000 });
    }
  };

  const handleCopyPath = async (path: string, successMessage = '已复制路径') => {
    try {
      await copyText(path);
      toast.success(successMessage, { duration: 1600 });
    } catch (error) {
      console.warn('复制深度解析路径失败:', error);
      toast.error('复制失败', { duration: 2000 });
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
          ? `${reportView?.filteredRecordCount || 0}/${reportView?.totalRecordCount || 0} 条展开记录 · ${reportView?.filteredPlaceholderCount || 0}/${reportView?.totalPlaceholderCount || 0} 个占位符 · ${reportView?.filteredUnresolvedCount || 0}/${reportView?.totalUnresolvedCount || 0} 条待检查 · ${reportView?.filteredWarningCount || 0}/${reportView?.totalWarningCount || 0} 条跳过记录`
          : '暂无解析上下文'}
      </div>
      <button
        onClick={handleCopyReport}
        disabled={!context}
        className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        复制报告
      </button>
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
                <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                  CMD {report.summary.schemeCounts.queryString}
                </span>
                <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                  URL {report.summary.schemeCounts.url}
                </span>
                <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                  Base64 {report.summary.schemeCounts.base64}
                </span>
                {report.summary.schemeCounts.nonReversible > 0 && (
                  <span className="bg-amber-900/30 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded">
                    不可逆 {report.summary.schemeCounts.nonReversible}
                  </span>
                )}
                {report.summary.unresolvedCount > 0 && (
                  <span className="bg-sky-900/30 text-sky-200 border border-sky-700/50 px-2 py-0.5 rounded">
                    待检查 {report.summary.unresolvedCount}
                  </span>
                )}
                {report.summary.placeholderCount > 0 && (
                  <span className="bg-violet-900/30 text-violet-200 border border-violet-700/50 px-2 py-0.5 rounded">
                    占位符 {report.summary.placeholderCount}
                  </span>
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
                      <div className="shrink-0 flex items-center gap-1.5">
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
                    {record.decodedPreview && (
                      <div className="mt-1 font-mono text-cyan-200 truncate" title={record.decodedPreview}>
                        解析结果: {record.decodedPreview}
                      </div>
                    )}
                    {record.decodedPaths.length > 0 && (
                      <div className="mt-1.5 flex flex-col gap-1">
                        <div className="text-gray-500">内部路径</div>
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
                              onClick={() => handleCopyPath(row.path)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制
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
                          <div className="text-gray-500">
                            还有更多内部路径未展示
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
                      <div className="shrink-0 flex items-center gap-1.5">
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
                <div className="text-xs text-gray-500 font-medium">
                  运行时占位符 · {reportView.filteredPlaceholderCount}
                  {reportView.isPlaceholderTruncated && (
                    <span className="text-amber-300 ml-2">仅显示前 {reportView.runtimePlaceholders.length} 条</span>
                  )}
                </div>
                <div data-tour="transform-report-placeholder-groups" className="grid gap-1.5">
                  {reportView.runtimePlaceholderGroups.map(group => (
                    <div
                      key={group.value}
                      className="rounded border border-violet-700/50 bg-violet-950/30 px-3 py-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-violet-100">{group.value}</span>
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
                            title={source.sourceOriginalValue || source.sourcePath}
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
                      <div className="shrink-0 flex items-center gap-1.5">
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
                        title={placeholder.sourceOriginalValue}
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
                      <div className="shrink-0 flex items-center gap-1.5">
                        <button
                          type="button"
                          data-tour="transform-report-warning-copy-path"
                          onClick={() => handleCopyPath(warning.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
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
              <div className="rounded border border-editor-border bg-editor-sidebar p-4 text-center text-xs text-gray-500">
                {query ? '没有匹配的解析记录' : '本次深度格式化没有展开嵌套字符串'}
              </div>
            )}
          </div>
        )}
      </div>
    </DraggablePanel>
  );
};
