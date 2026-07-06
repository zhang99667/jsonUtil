import type { Dispatch, SetStateAction } from 'react';
import type { TransformContext } from '../types';
import type { TransformReportCmdComparisonState } from '../utils/transformReportCmdComparisonController';
import type { TransformReportQualityBaseline } from '../utils/transformReportPanelCopyWorkflow';
import type { TransformReportPanelDerivedModel } from '../utils/transformReportPanelDerivedModel';
import type {
  TransformContextReport,
  TransformReportView,
} from '../utils/transformSummary';

export interface TransformReportPanelViewModelInput {
  isOpen: boolean;
  context: TransformContext | null;
}

export interface TransformReportPanelViewModel extends TransformReportPanelDerivedModel {
  activeContext: TransformContext | null;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  cmdComparisonState: TransformReportCmdComparisonState;
  setCmdComparisonState: Dispatch<SetStateAction<TransformReportCmdComparisonState>>;
  qualityBaseline: TransformReportQualityBaseline | null;
  setQualityBaseline: Dispatch<SetStateAction<TransformReportQualityBaseline | null>>;
  deferredQuery: string;
  isFilterPending: boolean;
  report: TransformContextReport | null;
  reportView: TransformReportView | null;
  fullReportView: TransformReportView | null;
}
