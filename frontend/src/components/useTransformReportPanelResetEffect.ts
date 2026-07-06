import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { TransformContext } from '../types';
import {
  resetTransformReportCmdComparisonState,
  type TransformReportCmdComparisonState,
} from '../utils/transformReportCmdComparisonController';
import type { TransformReportQualityBaseline } from '../utils/transformReportPanelCopyWorkflow';

interface TransformReportPanelResetEffectInput {
  activeContext: TransformContext | null;
  setQuery: Dispatch<SetStateAction<string>>;
  setCmdComparisonState: Dispatch<SetStateAction<TransformReportCmdComparisonState>>;
  setQualityBaseline: Dispatch<SetStateAction<TransformReportQualityBaseline | null>>;
}

export const useTransformReportPanelResetEffect = ({
  activeContext,
  setQuery,
  setCmdComparisonState,
  setQualityBaseline,
}: TransformReportPanelResetEffectInput): void => {
  useEffect(() => {
    setQuery('');
    setCmdComparisonState(resetTransformReportCmdComparisonState());
    setQualityBaseline(null);
  }, [activeContext]);
};
