import { FeatureId } from '../hooks/useFeatureTour';
import { TransformMode } from '../types';

const ACTION_PANEL_MODE_FEATURE_TOUR_BY_MODE: Partial<Record<TransformMode, FeatureId>> = {
  [TransformMode.DEEP_FORMAT]: FeatureId.DEEP_FORMAT,
  [TransformMode.ESCAPE]: FeatureId.ESCAPE,
  [TransformMode.UNESCAPE]: FeatureId.ESCAPE,
  [TransformMode.UNICODE_TO_CN]: FeatureId.UNICODE_CONVERT,
  [TransformMode.CN_TO_UNICODE]: FeatureId.UNICODE_CONVERT,
};

export const getActionPanelModeFeatureTour = (mode: TransformMode): FeatureId | null => (
  ACTION_PANEL_MODE_FEATURE_TOUR_BY_MODE[mode] ?? null
);
