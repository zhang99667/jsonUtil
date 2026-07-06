import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { TransformContext } from '../types';
import {
  createInitialTransformReportCmdComparisonState,
  resetTransformReportCmdComparisonState,
  type TransformReportCmdComparisonState,
} from '../utils/transformReportCmdComparisonController';
import type { TransformReportQualityBaseline } from '../utils/transformReportPanelCopyWorkflow';
import {
  buildTransformReportPanelDerivedModel,
  type TransformReportPanelDerivedModel,
} from '../utils/transformReportPanelDerivedModel';
import {
  buildTransformContextReport,
  buildTransformReportView,
  type TransformContextReport,
  type TransformReportView,
} from '../utils/transformSummary';

interface TransformReportPanelViewModelInput {
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

export const useTransformReportPanelViewModel = ({
  isOpen,
  context,
}: TransformReportPanelViewModelInput): TransformReportPanelViewModel => {
  const [query, setQuery] = useState('');
  const [cmdComparisonState, setCmdComparisonState] = useState(createInitialTransformReportCmdComparisonState);
  const [qualityBaseline, setQualityBaseline] = useState<TransformReportQualityBaseline | null>(null);
  const deferredQuery = useDeferredValue(query);
  const isFilterPending = query !== deferredQuery;
  const activeContext = isOpen ? context : null;
  const report = useMemo(() => (
    activeContext ? buildTransformContextReport(activeContext) : null
  ), [activeContext]);

  useEffect(() => {
    setQuery('');
    setCmdComparisonState(resetTransformReportCmdComparisonState());
  }, [activeContext]);

  const reportView = useMemo(() => (
    report ? buildTransformReportView(report, deferredQuery) : null
  ), [report, deferredQuery]);
  const fullReportView = useMemo(() => (
    report ? buildTransformReportView(report, '') : null
  ), [report]);
  const derivedModel = useMemo(() => (
    buildTransformReportPanelDerivedModel({
      report,
      reportView,
      fullReportView,
      deferredQuery,
      isFilterPending,
      qualityBaseline,
      hasActiveContext: Boolean(activeContext),
    })
  ), [activeContext, deferredQuery, fullReportView, isFilterPending, qualityBaseline, report, reportView]);

  return {
    activeContext,
    query,
    setQuery,
    cmdComparisonState,
    setCmdComparisonState,
    qualityBaseline,
    setQualityBaseline,
    deferredQuery,
    isFilterPending,
    report,
    reportView,
    fullReportView,
    ...derivedModel,
  };
};
