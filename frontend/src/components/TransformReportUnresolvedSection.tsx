import React from 'react';
import type { TransformReportUnresolvedCandidate } from '../utils/transformSummary';
import { TransformReportActionButton } from './TransformReportActionButton';
import { SourceLabelBadge } from './TransformReportPanelAtoms';

interface TransformReportUnresolvedSectionProps {
  unresolvedCandidates: TransformReportUnresolvedCandidate[];
  filteredUnresolvedCount: number;
  isUnresolvedTruncated: boolean;
  onCopyPath: (path: string) => void | Promise<void>;
  onCopyOriginalValue: (value: string) => void | Promise<void>;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
}

export const TransformReportUnresolvedSection: React.FC<TransformReportUnresolvedSectionProps> = ({
  unresolvedCandidates,
  filteredUnresolvedCount,
  isUnresolvedTruncated,
  onCopyPath,
  onCopyOriginalValue,
  onLocatePath,
  onOpenSchemeValue,
}) => (
  <div data-tour="transform-report-unresolved" className="flex flex-col gap-1.5">
    <div className="text-xs text-gray-500 font-medium">
      未展开线索 · {filteredUnresolvedCount}
      {isUnresolvedTruncated && (
        <span className="text-amber-300 ml-2">仅显示前 {unresolvedCandidates.length} 条</span>
      )}
    </div>
    {unresolvedCandidates.map(candidate => (
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
            <TransformReportActionButton
              data-tour="transform-report-unresolved-copy-path"
              onClick={() => { void onCopyPath(candidate.path); }}
            >
              复制路径
            </TransformReportActionButton>
            <TransformReportActionButton
              data-tour="transform-report-copy-unresolved-value"
              onClick={() => { void onCopyOriginalValue(candidate.originalValue); }}
            >
              复制原始值
            </TransformReportActionButton>
            {onLocatePath && (
              <TransformReportActionButton
                data-tour="transform-report-locate-unresolved-path"
                onClick={() => onLocatePath(candidate.path)}
                tone="locate"
              >
                定位
              </TransformReportActionButton>
            )}
            {onOpenSchemeValue && (
              <TransformReportActionButton
                data-tour="transform-report-open-unresolved-scheme"
                onClick={() => onOpenSchemeValue(candidate.originalValue)}
                tone="scheme"
              >
                Scheme 打开
              </TransformReportActionButton>
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
);
