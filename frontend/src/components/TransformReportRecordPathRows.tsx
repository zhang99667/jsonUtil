import React from 'react';
import type { TransformReportDecodedPath } from '../utils/transformSummary';
import {
  TransformReportRecordPathRow,
  type TransformReportRecordPathRowProps,
} from './TransformReportRecordPathRow';

interface TransformReportRecordPathRowsProps
  extends Omit<TransformReportRecordPathRowProps, 'row'> {
  title: string;
  rows: TransformReportDecodedPath[];
  countLabel: string;
  rowKeyPrefix: string;
  moreContent?: React.ReactNode;
  sectionDataTour?: string;
  moreDataTour?: string;
}

export const TransformReportRecordPathRows: React.FC<TransformReportRecordPathRowsProps> = ({
  title,
  rows,
  countLabel,
  rowKeyPrefix,
  moreContent,
  sectionDataTour,
  moreDataTour,
  ...rowProps
}) => (
  <div data-tour={sectionDataTour} className="mt-1.5 flex flex-col gap-1">
    <div className="text-gray-500">
      {title} · 显示 {rows.length}/{countLabel}
    </div>
    {rows.map(row => (
      <TransformReportRecordPathRow
        key={`${rowKeyPrefix}:${row.path}`}
        row={row}
        {...rowProps}
      />
    ))}
    {moreContent && (
      <div data-tour={moreDataTour} className="text-gray-500">
        {moreContent}
      </div>
    )}
  </div>
);
