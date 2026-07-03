import type { TransformReportPanelActionModel } from './transformReportPanelActionModelTypes';
import type { TransformReportPanelPlaceholderModel } from './transformReportPanelPlaceholderModel';
import type { TransformReportSectionVisibility } from './transformReportSectionVisibility';
import type { TransformContextReport, TransformReportView } from './transformSummary';

export interface TransformReportPanelSectionModelInput {
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
