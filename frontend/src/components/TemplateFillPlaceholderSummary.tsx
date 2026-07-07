import React from 'react';
import type { PlaceholderTemplateSummary } from '../utils/templateFillPanelModel';

interface TemplateFillPlaceholderSummaryProps {
  summary: PlaceholderTemplateSummary;
}

export const TemplateFillPlaceholderSummary: React.FC<TemplateFillPlaceholderSummaryProps> = ({
  summary,
}) => (
  <div
    data-tour="template-fill-placeholder-summary"
    className="rounded border border-violet-800/40 bg-violet-950/25 px-2.5 py-1.5 text-xs text-violet-100"
  >
    回填模板: replacement {summary.filled}/{summary.total}
    {summary.suggested > 0 && (
      <span> · 候选 {summary.suggested}</span>
    )}
    {summary.pending > 0 && (
      <span> · 待补 {summary.pending}</span>
    )}
  </div>
);
