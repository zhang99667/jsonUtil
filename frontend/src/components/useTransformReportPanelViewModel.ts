import {
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import {
  createInitialTransformReportCmdComparisonState,
} from '../utils/transformReportCmdComparisonController';
import {
  buildTransformReportPanelDerivedModel,
} from '../utils/transformReportPanelDerivedModel';
import type {
  TransformReportPanelViewModel,
  TransformReportPanelViewModelInput,
} from './TransformReportPanelViewModelTypes';
import { useTransformReportPanelReportViews } from './useTransformReportPanelReportViews';
import { useTransformReportPanelResetEffect } from './useTransformReportPanelResetEffect';

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
  const { report, reportView, fullReportView } = useTransformReportPanelReportViews({
    activeContext,
    deferredQuery,
  });

  useTransformReportPanelResetEffect({
    activeContext,
    setQuery,
    setCmdComparisonState,
    setQualityBaseline,
  });

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
