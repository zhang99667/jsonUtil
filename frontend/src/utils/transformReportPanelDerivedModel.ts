import {
  getTransformPlaceholderFillTemplateTitle,
} from './transformReportCopyTitles';
import { buildTransformReportPanelCopyTitles } from './transformReportPanelCopyTitleState';
import {
  buildTransformReportPanelCopyAvailability,
  buildTransformReportPanelIssueCopyTexts,
  buildTransformReportPanelPlaceholderFillState,
  buildTransformReportPanelQualityState,
} from './transformReportPanelDerivedValues';
import type {
  TransformReportPanelDerivedModel,
  TransformReportPanelDerivedModelInput,
} from './transformReportPanelDerivedModelTypes';

export type {
  TransformReportPanelDerivedModel,
  TransformReportPanelDerivedModelInput,
} from './transformReportPanelDerivedModelTypes';

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
