import type { TransformContextReport } from '../utils/transformSummary';
import type { TransformReportSummaryFilterButtonItem } from './transformReportSummaryMetricButtons';
import {
  getTransformReportSummaryFilterButtonCount,
  transformReportSummaryFilterButtonConfigs,
} from './transformReportSummaryFilterButtonConfig';

export const getTransformReportSummaryFilterButtonItems = (
  report: TransformContextReport,
  issuePriorityCount: number
): TransformReportSummaryFilterButtonItem[] => {
  return transformReportSummaryFilterButtonConfigs
    .map(({ countSource, ...config }) => ({
      ...config,
      count: getTransformReportSummaryFilterButtonCount(report, issuePriorityCount, countSource),
    }))
    .filter(item => item.count > 0);
};
