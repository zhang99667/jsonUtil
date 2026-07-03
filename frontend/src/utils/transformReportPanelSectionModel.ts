import type { TransformContextReport, TransformReportView } from './transformSummary';
import {
  buildTransformReportPanelPlaceholderModel,
  type TransformReportPanelPlaceholderModel,
} from './transformReportPanelPlaceholderModel';
import {
  buildTransformReportPanelActionModel,
  type TransformReportPanelActionModel,
} from './transformReportPanelActionModel';
import {
  buildTransformReportSectionVisibility,
  type TransformReportSectionVisibility,
} from './transformReportSectionVisibility';

interface TransformReportPanelSectionModelInput {
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  isFilterPending: boolean;
  hasTemplateFillTarget: boolean;
  hasPlaceholderFillTemplate: boolean;
  formatPlaceholderFillTitle: (readyTitle: string) => string;
  archivePackageTitle: string;
  collaborationReportTitle: string;
  qualitySnapshotTitle: string;
}

export interface TransformReportPanelSectionModel
  extends TransformReportPanelPlaceholderModel, TransformReportPanelActionModel {
  sectionVisibility: TransformReportSectionVisibility;
}

export const buildTransformReportPanelSectionModel = ({
  report,
  reportView,
  isFilterPending,
  hasTemplateFillTarget,
  hasPlaceholderFillTemplate,
  formatPlaceholderFillTitle,
  archivePackageTitle,
  collaborationReportTitle,
  qualitySnapshotTitle,
}: TransformReportPanelSectionModelInput): TransformReportPanelSectionModel => {
  const placeholderModel = buildTransformReportPanelPlaceholderModel({
    reportView,
    isFilterPending,
    hasTemplateFillTarget,
    hasPlaceholderFillTemplate,
    formatPlaceholderFillTitle,
  });
  const actionModel = buildTransformReportPanelActionModel({
    report,
    reportView,
    isFilterPending,
    canOpenPlaceholderFill: placeholderModel.canOpenPlaceholderFill,
    placeholderFillTitle: placeholderModel.placeholderFillPanelTitle,
    archivePackageTitle,
    collaborationReportTitle,
    qualitySnapshotTitle,
  });

  return {
    ...placeholderModel,
    ...actionModel,
    sectionVisibility: buildTransformReportSectionVisibility(reportView),
  };
};
