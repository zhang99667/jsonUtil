export type ToolEventStatus = 'success' | 'error' | 'skipped' | 'cancelled';

export interface ToolEventPayload {
  eventName: string;
  category: string;
  status?: ToolEventStatus;
  inputSizeBucket?: string;
  durationBucket?: string;
  source?: string;
}

const TOOL_EVENT_ENDPOINT = '/api/visitor/events';

const isLocalTelemetryHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
};

export const shouldEnableToolEventTelemetry = (): boolean => {
  if (import.meta.env.VITE_TOOL_EVENT_TELEMETRY_ENABLED === 'true') {
    return true;
  }
  if (isLocalTelemetryHost()) {
    return false;
  }
  return import.meta.env.PROD === true;
};

export const getTextSizeBucket = (text: string): string => {
  if (text.length === 0) return 'empty';
  if (text.length >= 1024 * 1024) return 'gt_1mb';

  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 10 * 1024) return 'lt_10kb';
  if (bytes < 50 * 1024) return '10_50kb';
  if (bytes < 250 * 1024) return '50_250kb';
  if (bytes < 1024 * 1024) return '250kb_1mb';
  return 'gt_1mb';
};

export const getDurationBucket = (durationMs: number): string => {
  if (!Number.isFinite(durationMs) || durationMs < 0) return 'unknown';
  if (durationMs === 0) return 'instant';
  if (durationMs < 100) return 'lt_100ms';
  if (durationMs < 500) return '100_500ms';
  if (durationMs < 2_000) return '500ms_2s';
  if (durationMs < 10_000) return '2_10s';
  return 'gt_10s';
};

export const buildToolEventPayload = ({
  eventName,
  category,
  status = 'success',
  inputSizeBucket = 'unknown',
  durationBucket = 'unknown',
  source = 'web',
}: ToolEventPayload): Required<ToolEventPayload> => ({
  eventName,
  category,
  status,
  inputSizeBucket,
  durationBucket,
  source,
});

export const trackToolEvent = (payload: ToolEventPayload): void => {
  if (typeof window === 'undefined') return;
  if (!shouldEnableToolEventTelemetry()) return;

  const body = JSON.stringify(buildToolEventPayload(payload));
  const blob = new Blob([body], { type: 'application/json' });

  if (navigator.sendBeacon?.(TOOL_EVENT_ENDPOINT, blob)) {
    return;
  }

  fetch(TOOL_EVENT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => {
    // 工具事件只是产品观测信号，失败不影响主流程。
  });
};
