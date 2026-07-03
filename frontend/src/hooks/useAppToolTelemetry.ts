import { useCallback } from 'react';
import {
  getDurationBucket,
  getTextSizeBucket,
  trackToolEvent,
  type ToolEventStatus,
} from '../utils/productTelemetry';

type TextRef = { current: string };
type UseAppToolTelemetryInput = { inputRef: TextRef; now?: () => number };

type AppTrackToolEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

const getCurrentPerformanceTime = () => performance.now();

export const useAppToolTelemetry = (
  { inputRef, now = getCurrentPerformanceTime }: UseAppToolTelemetryInput,
): AppTrackToolEvent => useCallback((eventName, category, status: ToolEventStatus = 'success', startedAt) => {
  const durationMs = typeof startedAt === 'number' ? now() - startedAt : 0;
  trackToolEvent({
    eventName,
    category,
    status,
    inputSizeBucket: getTextSizeBucket(inputRef.current),
    durationBucket: getDurationBucket(durationMs),
  });
}, [inputRef, now]);
