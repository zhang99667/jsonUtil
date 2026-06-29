import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import {
  buildCmdComparisonPanelState,
  type CmdComparisonCandidateInput,
  type CmdComparisonDiffSummary,
  type RankedCmdComparisonCandidate,
} from '../utils/transformReportCmdComparison';
import { formatCmdCandidateSummary } from '../utils/transformReportCmdComparisonHelpers';
import { SourceLabelBadge } from './TransformReportPanelAtoms';

interface TransformReportCmdComparisonPanelProps {
  record: TransformReportRecord;
  candidateRecords: TransformReportRecord[];
  expectedText: string;
  ignoreExtraPaths: boolean;
  activeCandidate: CmdComparisonCandidateInput | null;
  onExpectedTextChange: (text: string) => void;
  onIgnoreExtraPathsChange: (ignoreExtraPaths: boolean) => void;
  onCopyDiff: (record: TransformReportRecord) => void;
  onToggle: (record: TransformReportRecord) => void;
  onSwitchCandidate: (candidate: RankedCmdComparisonCandidate) => void;
}

export const formatCmdComparisonDiffSummaryLabel = (diffSummary: CmdComparisonDiffSummary): string => (
  diffSummary.hasDifferences
    ? `存在差异：Schema ${diffSummary.hasSchemaDiff ? 1 : 0}，Source ${diffSummary.hasSourceDiff ? 1 : 0}，${diffSummary.missingLabel}，${diffSummary.extraLabel}，值不一致 ${diffSummary.valueDiffCount}${diffSummary.ignoredExtraLabel ? `，${diffSummary.ignoredExtraLabel}` : ''}`
    : `结构一致${diffSummary.ignoredExtraLabel ? `，${diffSummary.ignoredExtraLabel.replace('已忽略', '已忽略额外')}` : ''}`
);

export const TransformReportCmdComparisonPanel: React.FC<TransformReportCmdComparisonPanelProps> = ({
  record,
  candidateRecords,
  expectedText,
  ignoreExtraPaths,
  activeCandidate,
  onExpectedTextChange,
  onIgnoreExtraPathsChange,
  onCopyDiff,
  onToggle,
  onSwitchCandidate,
}) => {
  const trimmedExpectedText = expectedText.trim();
  const activeCandidateId = activeCandidate?.id || record.path;
  const {
    diffReportText,
    diffSummary,
    errorText,
    candidateRecommendations,
  } = buildCmdComparisonPanelState(
    record,
    candidateRecords,
    trimmedExpectedText,
    ignoreExtraPaths,
    activeCandidate
  );
  const bestCandidate = candidateRecommendations[0];
  const shouldWarnCurrentCandidate = Boolean(bestCandidate && bestCandidate.id !== activeCandidateId);

  return (
    <div data-tour="transform-report-cmd-comparison-panel" className="mt-2 rounded border border-teal-800/50 bg-teal-950/20 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-teal-100">cmdHandler 对比</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-tour="transform-report-copy-cmd-comparison-diff"
            onClick={() => onCopyDiff(record)}
            disabled={!diffReportText}
            className="text-gray-400 hover:text-teal-100 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="复制当前 actual 与 cmdHandler expected 的差异报告"
          >
            复制差异
          </button>
          <button
            type="button"
            onClick={() => onToggle(record)}
            className="text-gray-400 hover:text-teal-100 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
          >
            收起
          </button>
        </div>
      </div>
      <textarea
        data-tour="transform-report-cmd-comparison-input"
        value={expectedText}
        onChange={(event) => onExpectedTextChange(event.target.value)}
        placeholder="粘贴 cmdHandler 输出或整段 response，支持 JSON / result / data / 代码块 / 日志前缀"
        title="粘贴 cmdHandler 输出或整段 response，支持 JSON、result/data 包裹、Markdown 代码块、日志前缀、树形文本和字符串化 JSON"
        className="mt-2 h-24 w-full resize-y rounded border border-editor-border bg-editor-bg px-2 py-1.5 font-mono text-xs text-gray-200 outline-none focus:border-teal-600"
        spellCheck={false}
      />
      <label
        className="mt-2 flex items-center gap-2 text-gray-400"
        title="expected 只保存稳定子集时，忽略本工具 actual 中多出的路径"
      >
        <input
          type="checkbox"
          checked={ignoreExtraPaths}
          onChange={(event) => onIgnoreExtraPathsChange(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-editor-border bg-editor-bg text-teal-500 focus:ring-teal-600"
        />
        <span>忽略 actual 额外路径</span>
      </label>
      {!trimmedExpectedText && (
        <div className="mt-1 text-gray-500">
          把内部 cmdHandler 的解析结果或接口 response 粘到这里，会自动清洗日志前缀、Markdown 代码块、树形文本或字符串化 JSON，并对比 cmdSchema、source 和 cmdParams 路径值差异。
        </div>
      )}
      {errorText && (
        <div className="mt-1 text-amber-200">
          {errorText}
        </div>
      )}
      {diffSummary && (
        <div className="mt-1 flex flex-col gap-1">
          <div className={diffSummary.hasDifferences ? 'text-amber-200' : 'text-emerald-200'}>
            {formatCmdComparisonDiffSummaryLabel(diffSummary)}
          </div>
          {diffSummary.previewLines.length > 0 && (
            <div className="flex flex-col gap-0.5 font-mono text-gray-400">
              {diffSummary.previewLines.map(line => (
                <div key={`${record.path}:cmd-diff:${line}`} className="truncate" title={line}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {candidateRecommendations.length > 1 && (
        <div data-tour="transform-report-cmd-candidate-recommendations" className="mt-2 rounded border border-editor-border bg-editor-bg/70 px-2 py-1.5">
          <div className={shouldWarnCurrentCandidate ? 'text-amber-200' : 'text-gray-300'}>
            {shouldWarnCurrentCandidate
              ? '可能拿错 actual，下面的 CMD 与 expected 更接近'
              : '当前 actual 已是最匹配候选'}
          </div>
          <div className="mt-1 flex flex-col gap-1">
            {candidateRecommendations.map((candidate, index) => {
              const isCurrentCandidate = candidate.id === activeCandidateId;
              const summary = formatCmdCandidateSummary(candidate);
              return (
                <button
                  key={`${record.path}:cmd-candidate:${candidate.id}`}
                  type="button"
                  data-tour="transform-report-cmd-candidate"
                  onClick={() => onSwitchCandidate(candidate)}
                  disabled={isCurrentCandidate}
                  className="flex min-w-0 items-center justify-between gap-2 rounded border border-editor-border bg-editor-sidebar px-2 py-1 text-left text-gray-300 transition-colors hover:border-teal-700 hover:text-teal-100 disabled:cursor-default disabled:opacity-70"
                  title={`${candidate.label} · ${summary}`}
                >
                  <span className="min-w-0 flex items-center gap-1.5">
                    <span className={candidate.isExactMatch ? 'text-emerald-300' : index === 0 ? 'text-amber-200' : 'text-gray-500'}>
                      #{index + 1}
                    </span>
                    <span className="max-w-[220px] truncate font-mono text-emerald-300">
                      {candidate.label}
                    </span>
                    {candidate.sourceLabel && (
                      <SourceLabelBadge label={candidate.sourceLabel} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-right text-gray-400">
                    {isCurrentCandidate ? '当前 · ' : ''}
                    {candidate.commandSchema ? `${candidate.commandSchema} · ` : ''}
                    {summary}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
