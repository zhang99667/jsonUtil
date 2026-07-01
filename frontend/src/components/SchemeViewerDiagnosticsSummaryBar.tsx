import React from 'react';
import type { SchemeQualitySummary } from '../utils/schemeQualitySummary';
import type { SchemeDiagnosticSummaryItem } from '../utils/schemeViewerDiagnostics';
import { getSchemeQualityClassName } from '../utils/schemeViewerQualityStyles';

interface SchemeViewerDiagnosticsSummaryBarProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  schemeQualitySummary: SchemeQualitySummary | null;
  diagnosticSummaryItems: SchemeDiagnosticSummaryItem[];
}

export const SchemeViewerDiagnosticsSummaryBar: React.FC<SchemeViewerDiagnosticsSummaryBarProps> = ({
  isExpanded,
  onToggleExpanded,
  schemeQualitySummary,
  diagnosticSummaryItems,
}) => (
  <div className="flex items-center gap-2 px-3 py-1.5">
    <button
      type="button"
      onClick={onToggleExpanded}
      className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
      aria-expanded={isExpanded}
      aria-controls="scheme-diagnostics-detail"
      title={isExpanded ? '收起 Scheme 解析详情' : '展开 Scheme 解析详情'}
    >
      <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${
        schemeQualitySummary
          ? getSchemeQualityClassName(schemeQualitySummary.level)
          : 'border-editor-border bg-editor-bg text-gray-300'
      }`}>
        {schemeQualitySummary?.label || '解析信息'}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-gray-400 [&::-webkit-scrollbar]:hidden">
        {diagnosticSummaryItems.map(item => (
          <span
            key={item.key}
            className="rounded bg-editor-bg px-2 py-0.5 font-mono text-gray-300"
            title={item.title}
          >
            {item.label}
          </span>
        ))}
      </span>
    </button>
    <button
      type="button"
      onClick={onToggleExpanded}
      className="shrink-0 rounded bg-editor-active px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-border hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
      aria-expanded={isExpanded}
      aria-controls="scheme-diagnostics-detail"
    >
      {isExpanded ? '收起详情' : '展开详情'}
    </button>
  </div>
);
