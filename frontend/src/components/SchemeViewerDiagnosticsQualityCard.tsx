import React from 'react';
import type { SchemeQualitySummary } from '../utils/schemeQualitySummary';
import {
  getSchemeQualityClassName,
  getSchemeQualityItemClassName,
} from '../utils/schemeViewerQualityStyles';

interface SchemeViewerDiagnosticsQualityCardProps {
  schemeQualitySummary: SchemeQualitySummary | null;
  canInspectOriginal: boolean;
  onInspectOriginal: () => void;
  onCopyQualitySummary: () => void;
  onCopyQualitySnapshot: () => void;
  copyQualitySnapshotTitle: string;
}

export const SchemeViewerDiagnosticsQualityCard: React.FC<SchemeViewerDiagnosticsQualityCardProps> = ({
  schemeQualitySummary,
  canInspectOriginal,
  onInspectOriginal,
  onCopyQualitySummary,
  onCopyQualitySnapshot,
  copyQualitySnapshotTitle,
}) => {
  if (!schemeQualitySummary) return null;

  return (
    <div
      data-tour="scheme-quality-summary"
      className={`rounded border px-2.5 py-2 text-xs ${getSchemeQualityClassName(schemeQualitySummary.level)}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="shrink-0 font-medium">{schemeQualitySummary.label}</span>
        <span className="min-w-0 text-gray-300">{schemeQualitySummary.description}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {canInspectOriginal && (
            <button
              data-tour="scheme-inspect-original"
              type="button"
              onClick={onInspectOriginal}
              className="rounded border border-emerald-500/40 bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-100 transition-colors hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
              title="将原始值送入 SOURCE 并打开深度解析报告"
              aria-label="用原始值排查，将原始值送入 SOURCE 并打开深度解析报告"
            >
              用原始值排查
            </button>
          )}
          <button
            data-tour="scheme-copy-quality-summary"
            type="button"
            onClick={onCopyQualitySummary}
            className="rounded border border-current/20 px-2 py-0.5 text-xs text-gray-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current/30"
            title="复制当前 Scheme 解析质量摘要"
            aria-label="复制质量摘要，复制当前 Scheme 解析质量摘要"
          >
            复制摘要
          </button>
          <button
            data-tour="scheme-copy-quality-snapshot"
            type="button"
            onClick={onCopyQualitySnapshot}
            className="rounded border border-current/20 px-2 py-0.5 text-xs text-gray-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current/30"
            title={copyQualitySnapshotTitle}
            aria-label={`复制质量快照，${copyQualitySnapshotTitle}`}
          >
            复制快照
          </button>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {schemeQualitySummary.items.map(item => (
          <span
            key={item.label}
            className={`rounded border px-2 py-0.5 font-mono ${getSchemeQualityItemClassName(item.tone)}`}
          >
            {item.label} · {item.value}
          </span>
        ))}
      </div>
    </div>
  );
};
