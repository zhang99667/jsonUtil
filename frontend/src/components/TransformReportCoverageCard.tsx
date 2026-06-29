import React from 'react';
import type { TransformReportCoverage } from '../utils/transformSummary';
import { getCoverageClassName } from '../utils/transformReportPanelStyles';

interface TransformReportCoverageCardProps {
  coverage: TransformReportCoverage;
}

export const TransformReportCoverageCard: React.FC<TransformReportCoverageCardProps> = ({
  coverage,
}) => (
  <div
    data-tour="transform-report-coverage"
    className={`mt-2 rounded border px-2 py-1.5 text-xs ${getCoverageClassName(coverage.level)}`}
  >
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-medium">{coverage.label}</span>
      <span className="text-current/80">{coverage.description}</span>
    </div>
    {coverage.items.length > 0 && (
      <div className="mt-1 flex flex-wrap gap-1">
        {coverage.items.map(item => (
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
);
