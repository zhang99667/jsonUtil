import type {
  TransformReportCopyTitles,
} from './transformReportCopyTitles';
import type { TransformReportQualityBaseline } from './transformReportPanelCopyWorkflow';
import type {
  TransformReportPanelCopyAvailability,
  TransformReportPanelIssueCopyTexts,
  TransformReportPanelPlaceholderFillState,
  TransformReportPanelQualityState,
} from './transformReportPanelDerivedValues';
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
}
