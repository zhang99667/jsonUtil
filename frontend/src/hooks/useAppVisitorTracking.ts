import { useEffect } from 'react';
import { initGoogleAnalytics } from '../utils/analytics';

type VisitorPing = (url: string) => Promise<unknown>;

interface UseAppVisitorTrackingInput {
  measurementId?: string;
  ping?: VisitorPing;
}

const sendVisitorPing: VisitorPing = url => fetch(url);

export const useAppVisitorTracking = ({
  measurementId,
  ping = sendVisitorPing,
}: UseAppVisitorTrackingInput): void => {
  useEffect(() => {
    initGoogleAnalytics(measurementId);

    void ping('/api/visitor/ping').catch(() => {
      // 静默失败，不影响用户体验
    });
  }, [measurementId, ping]);
};
