import {
  getDurationBucket,
  getTextSizeBucket,
  trackToolEvent,
  type ToolEventStatus,
} from './productTelemetry';

interface JsonPathQueryTelemetryInput {
  jsonData: string;
  status: ToolEventStatus;
  startedAt: number;
}

export const trackJsonPathQueryEvent = ({
  jsonData,
  status,
  startedAt,
}: JsonPathQueryTelemetryInput): void => {
  const durationMs = typeof performance === 'undefined' ? -1 : performance.now() - startedAt;
  trackToolEvent({
    eventName: 'JSONPATH_QUERY',
    category: 'jsonpath',
    status,
    inputSizeBucket: getTextSizeBucket(jsonData),
    durationBucket: getDurationBucket(durationMs),
  });
};
