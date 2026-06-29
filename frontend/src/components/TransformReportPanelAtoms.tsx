import React from 'react';
import type { TransformReportRecord } from '../utils/transformSummary';
import {
  getSourceLabelDisplayValue,
  getSourceLabelKindText,
  isHarSourceLabel,
} from '../utils/sourceLabels';

export const COMMAND_SCHEMA_ROW_DISPLAY_LIMIT = 8;

export const SourceLabelBadge: React.FC<{ label?: string }> = ({ label }) => {
  if (!label) return null;

  const isHarLabel = isHarSourceLabel(label);
  const displayValue = getSourceLabelDisplayValue(label);
  const title = `${getSourceLabelKindText(label)}: ${displayValue}`;

  return (
    <span
      className={`max-w-[160px] shrink-0 truncate rounded px-2 py-0.5 ${
        isHarLabel
          ? 'bg-teal-900/40 text-teal-100'
          : 'bg-cyan-900/40 text-cyan-200'
      }`}
      title={title}
    >
      {isHarLabel ? `接口 · ${displayValue}` : displayValue}
    </span>
  );
};

export const formatDecodedPathCount = (record: TransformReportRecord): string => (
  record.isDecodedPathCountTruncated ? `${record.decodedPathCount}+` : String(record.decodedPathCount)
);

interface SummaryMetricChipProps {
  label: string;
  count: number;
  query: string;
  dataTour: string;
  title: string;
  onFilter: (query: string) => void;
}

export const SummaryMetricChip: React.FC<SummaryMetricChipProps> = ({
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
