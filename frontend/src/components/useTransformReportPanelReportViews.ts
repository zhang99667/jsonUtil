import { useMemo } from 'react';
import type { TransformContext } from '../types';
import {
  buildTransformContextReport,
  buildTransformReportView,
} from '../utils/transformSummary';
import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';

export interface TransformReportPanelReportViews {
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  fullReportView: TransformReportView | null;
}

interface UseTransformReportPanelReportViewsInput {
  activeContext: TransformContext | null;
  deferredQuery: string;
}

export const useTransformReportPanelReportViews = ({
  activeContext,
  deferredQuery,
}: UseTransformReportPanelReportViewsInput): TransformReportPanelReportViews => {
  const report = useMemo(() => (
    activeContext ? buildTransformContextReport(activeContext) : null
  ), [activeContext]);
  const reportView = useMemo(() => (
    report ? buildTransformReportView(report, deferredQuery) : null
  ), [report, deferredQuery]);
  const fullReportView = useMemo(() => (
    report ? buildTransformReportView(report, '') : null
  ), [report]);

  return {
    report,
    reportView,
    fullReportView,
  };
};
