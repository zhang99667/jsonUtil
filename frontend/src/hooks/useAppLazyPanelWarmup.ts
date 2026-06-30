import { useEffect } from 'react';
import { preloadFrequentAppLazyPanels } from '../components/appLazyPanels';

const LAZY_PANEL_WARMUP_DELAY_MS = 8_000;

interface NavigatorConnectionLike {
  saveData?: boolean;
}

const isDataSaverEnabled = (): boolean => (
  Boolean((navigator as Navigator & { connection?: NavigatorConnectionLike }).connection?.saveData)
);

export const useAppLazyPanelWarmup = () => {
  useEffect(() => {
    if (!import.meta.env.PROD || isDataSaverEnabled()) return undefined;

    const timer = window.setTimeout(() => {
      if (document.visibilityState !== 'visible') return;

      void preloadFrequentAppLazyPanels();
    }, LAZY_PANEL_WARMUP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);
};
