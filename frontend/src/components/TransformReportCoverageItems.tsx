import React from 'react';

interface TransformReportCoverageItemsProps {
  items: readonly string[];
}

export const TransformReportCoverageItems: React.FC<TransformReportCoverageItemsProps> = ({
  items,
}) => {
  if (items.length === 0) return null;

  return (
    <div data-tour="transform-report-coverage-items" className="mt-1 flex flex-wrap gap-1">
      {items.map(item => (
        <span
          key={item}
          className="rounded bg-editor-bg/70 px-2 py-0.5 text-current/80"
        >
          {item}
        </span>
      ))}
    </div>
  );
};
