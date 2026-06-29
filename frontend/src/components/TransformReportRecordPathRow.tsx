import React from 'react';
import type { TransformReportDecodedPath } from '../utils/transformSummary';
import {
  TransformReportRecordPathRowActions,
  type TransformReportRecordPathRowActionsProps,
} from './TransformReportRecordPathRowActions';

export interface TransformReportRecordPathRowProps
  extends TransformReportRecordPathRowActionsProps {
  rowDataTour: string;
  rowClassName: string;
  pathClassName: string;
  valueClassName: string;
}

export const TransformReportRecordPathRow: React.FC<TransformReportRecordPathRowProps> = ({
  row,
  rowDataTour,
  rowClassName,
  pathClassName,
  valueClassName,
  ...actionProps
}) => (
  <div data-tour={rowDataTour} className={rowClassName}>
    <div className="min-w-0 flex flex-1 items-center gap-1 font-mono overflow-hidden">
      <span className={pathClassName} title={row.path}>
        {row.path}
      </span>
      <span className="shrink-0 text-gray-500">=</span>
      <span className={valueClassName} title={row.preview}>
        {row.preview}
      </span>
    </div>
    <TransformReportRecordPathRowActions
      row={row}
      {...actionProps}
    />
  </div>
);
