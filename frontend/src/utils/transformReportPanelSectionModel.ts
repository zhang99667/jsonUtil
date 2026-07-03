import {
  buildTransformReportPanelPlaceholderModel,
} from './transformReportPanelPlaceholderModel';
import { buildTransformReportPanelActionModel } from './transformReportPanelActionModel';
import { buildTransformReportSectionVisibility } from './transformReportSectionVisibility';
import type {
  TransformReportPanelSectionModel,
  TransformReportPanelSectionModelInput,
} from './transformReportPanelSectionModelTypes';

export type {
  TransformReportPanelSectionModel,
  TransformReportPanelSectionModelInput,
} from './transformReportPanelSectionModelTypes';

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
