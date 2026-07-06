import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createInitialTransformReportCmdComparisonState,
  resetTransformReportCmdComparisonState,
} from '../utils/transformReportCmdComparisonController';
import {
  buildTransformReportPanelDerivedModel,
} from '../utils/transformReportPanelDerivedModel';
import {
  buildTransformContextReport,
  buildTransformReportView,
} from '../utils/transformSummary';
import type {
  TransformReportPanelViewModel,
  TransformReportPanelViewModelInput,
} from './TransformReportPanelViewModelTypes';

export const useTransformReportPanelViewModel = ({
  isOpen,
  context,
}: TransformReportPanelViewModelInput): TransformReportPanelViewModel => {
  const [query, setQuery] = useState('');
  const [cmdComparisonState, setCmdComparisonState] = useState(createInitialTransformReportCmdComparisonState);
  const [qualityBaseline, setQualityBaseline] = useState<TransformReportPanelViewModel['qualityBaseline']>(null);
  const deferredQuery = useDeferredValue(query);
  const isFilterPending = query !== deferredQuery;
  const activeContext = isOpen ? context : null;
  const hasActiveContext = Boolean(activeContext);
  const report = useMemo(() => (
    activeContext ? buildTransformContextReport(activeContext) : null
  ), [activeContext]);

  useEffect(() => {
    setQuery('');
    setCmdComparisonState(resetTransformReportCmdComparisonState());
    setQualityBaseline(null);
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
      hasActiveContext,
    })
  ), [deferredQuery, fullReportView, hasActiveContext, isFilterPending, qualityBaseline, report, reportView]);

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
