import { useEffect, useRef } from 'react';
import { FeatureId, useFeatureTour } from './useFeatureTour';

export const useJsonPathPanelTour = (isOpen: boolean): void => {
  const { triggerFeatureFirstUse, refreshTour } = useFeatureTour();
  const hasTriggeredTour = useRef(false);

  useEffect(() => {
    if (isOpen && !hasTriggeredTour.current) {
      hasTriggeredTour.current = true;
      triggerFeatureFirstUse(FeatureId.JSONPATH);
    }
  }, [isOpen, triggerFeatureFirstUse]);

  useEffect(() => {
    if (isOpen) {
      refreshTour();
    }
  }, [isOpen, refreshTour]);
};
