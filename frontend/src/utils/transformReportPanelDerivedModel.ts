import {
  getTransformPlaceholderFillTemplateTitle,
  type TransformReportCopyTitles,
} from './transformReportCopyTitles';
import { buildTransformReportPanelCopyTitles } from './transformReportPanelCopyTitleState';
import {
  buildTransformReportPanelCopyAvailability,
  buildTransformReportPanelIssueCopyTexts,
  buildTransformReportPanelPlaceholderFillState,
  buildTransformReportPanelQualityState,
  type TransformReportPanelCopyAvailability,
  type TransformReportPanelIssueCopyTexts,
  type TransformReportPanelPlaceholderFillState,
  type TransformReportPanelQualityState,
} from './transformReportPanelDerivedValues';
import type { TransformReportQualityBaseline } from './transformReportPanelCopyWorkflow';
import type {
  TransformContextReport,
  TransformReportView,
} from './transformSummary';

export interface TransformReportPanelDerivedModelInput {
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  fullReportView: TransformReportView | null;
  deferredQuery: string;
  isFilterPending: boolean;
  qualityBaseline: TransformReportQualityBaseline | null;
  hasActiveContext: boolean;
}

export interface TransformReportPanelDerivedModel
  extends TransformReportPanelCopyAvailability,
    TransformReportPanelIssueCopyTexts,
    TransformReportPanelPlaceholderFillState,
    TransformReportPanelQualityState {
  hasReportView: boolean;
  copyTitles: TransformReportCopyTitles;
  getPanelPlaceholderFillTemplateTitle: (readyTitle: string) => string;
}

export const buildTransformReportPanelDerivedModel = ({
  report,
  reportView,
  fullReportView,
  deferredQuery,
  isFilterPending,
  qualityBaseline,
  hasActiveContext,
}: TransformReportPanelDerivedModelInput): TransformReportPanelDerivedModel => {
  const copyAvailability = buildTransformReportPanelCopyAvailability(reportView);
  const issueCopyTexts = buildTransformReportPanelIssueCopyTexts(reportView, deferredQuery);
  const placeholderFillState = buildTransformReportPanelPlaceholderFillState(
    reportView,
    fullReportView,
    deferredQuery
  );
  const qualityState = buildTransformReportPanelQualityState(
    report,
    reportView,
    deferredQuery,
    qualityBaseline
  );
  const hasReportView = Boolean(reportView);
  const copyTitles = buildTransformReportPanelCopyTitles({
    hasReportView,
    isFilterPending,
    hasActiveContext,
    copyAvailability,
    issueCopyTexts,
    qualityState,
  });
  const getPanelPlaceholderFillTemplateTitle = (readyTitle: string): string => (
    getTransformPlaceholderFillTemplateTitle(
      readyTitle,
      Boolean(placeholderFillState.placeholderFillTemplateJsonText),
      placeholderFillState.placeholderFillTemplateSummary,
      isFilterPending
    )
  );

  return {
    ...copyAvailability,
    ...issueCopyTexts,
    ...placeholderFillState,
    ...qualityState,
    hasReportView,
    copyTitles,
    getPanelPlaceholderFillTemplateTitle,
  };
};
