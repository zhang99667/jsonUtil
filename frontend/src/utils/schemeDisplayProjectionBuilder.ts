import type { JsonValue } from '../types';
import { appendJsonPointerSegment } from './jsonPointer';
import { getSchemeDisplayHeaderKey } from './schemeDisplayHeader';
import type {
  DecodeLayer,
  SchemeDisplayHeaderRecord,
  StructuredValue,
} from './schemeTypes';

export interface SchemeDisplayHeaderEvent {
  internalKey: string;
  internalValue: string;
  header: string;
  source: string;
  layers: DecodeLayer[];
}

export interface SchemeDisplayProjection {
  businessDecoded: string;
  displayDecoded: string;
  headers: SchemeDisplayHeaderRecord[];
}

interface ProjectedValue { businessValue: StructuredValue; displayValue: StructuredValue }

const countEventMarkers = (
  value: StructuredValue,
  eventsByInternalKey: ReadonlyMap<string, SchemeDisplayHeaderEvent>,
  markerCounts: Map<string, number>,
): void => {
  if (Array.isArray(value)) {
    value.forEach(item => countEventMarkers(item, eventsByInternalKey, markerCounts));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, item]) => {
    const event = eventsByInternalKey.get(key);
    if (event && item === event.internalValue) {
      markerCounts.set(key, (markerCounts.get(key) ?? 0) + 1);
    }
    countEventMarkers(item, eventsByInternalKey, markerCounts);
  });
};

const createEventMatcher = (
  parsed: StructuredValue,
  events: SchemeDisplayHeaderEvent[],
): ((value: Record<string, StructuredValue>) => SchemeDisplayHeaderEvent | undefined) | null => {
  const remainingEvents = new Map(events.map(event => [event.internalKey, event]));
  const markerCounts = new Map<string, number>();
  countEventMarkers(parsed, remainingEvents, markerCounts);
  const hasAmbiguousEvent = events.some(
    event => markerCounts.get(event.internalKey) !== 1,
  );
  if (hasAmbiguousEvent) return null;
  return value => {
    for (const [key, item] of Object.entries(value)) {
      const event = remainingEvents.get(key);
      if (!event || item !== event.internalValue) continue;
      remainingEvents.delete(key);
      return event;
    }
    return undefined;
  };
};

const createObject = (
  entries: [string, ProjectedValue][],
  field: keyof ProjectedValue,
): Record<string, StructuredValue> => Object.fromEntries(
  entries.map(([key, projected]) => [key, projected[field]]),
);

export const buildSchemeDisplayProjectionValue = (
  parsed: StructuredValue,
  events: SchemeDisplayHeaderEvent[],
): SchemeDisplayProjection | null => {
  const takeEvent = createEventMatcher(parsed, events);
  if (!takeEvent) return null;

  const reservedKeysByHeader = new Map<string, Set<string>>();
  const headers: SchemeDisplayHeaderRecord[] = [];

  const project = (
    value: StructuredValue,
    path: string,
    hasArraySegment: boolean,
  ): ProjectedValue => {
    if (Array.isArray(value)) {
      const items = value.map((item, index) => (
        project(item, appendJsonPointerSegment(path, String(index)), true)
      ));
      return {
        businessValue: items.map(item => item.businessValue),
        displayValue: items.map(item => item.displayValue),
      };
    }
    if (!value || typeof value !== 'object') {
      return { businessValue: value, displayValue: value };
    }

    const event = takeEvent(value as Record<string, StructuredValue>);
    const headerKey = event
      ? getSchemeDisplayHeaderKey(
          value as Record<string, JsonValue>,
          reservedKeysByHeader.get(event.header),
          event.source,
        )
      : undefined;
    let headerRecord: SchemeDisplayHeaderRecord | undefined;
    if (event && headerKey) {
      const reservedKeys = reservedKeysByHeader.get(event.header) ?? new Set();
      reservedKeys.add(headerKey);
      reservedKeysByHeader.set(event.header, reservedKeys);
      headerRecord = {
        path,
        headerKey,
        header: event.header,
        source: event.source,
        layers: path === '' ? [] : event.layers,
      };
      headers.push(headerRecord);
    }

    const projectedEntries = Object.entries(value)
      .filter(([key]) => key !== event?.internalKey)
      .map(([key, item]) => [
        key,
        project(item, appendJsonPointerSegment(path, key), hasArraySegment),
      ] as [string, ProjectedValue]);
    const businessValue = createObject(projectedEntries, 'businessValue');
    const displayBusinessValue = createObject(projectedEntries, 'displayValue');
    const displayValue = event && headerKey
      ? { [headerKey]: event.header, ...displayBusinessValue }
      : displayBusinessValue;
    if (headerRecord && hasArraySegment) {
      headerRecord.displayValueSnapshot = JSON.stringify(displayValue);
    }
    return { businessValue, displayValue };
  };

  const projected = project(parsed, '', false);
  // 投影必须完整消费全部事件，避免内部字段残留到业务数据或展示数据。
  if (headers.length !== events.length) return null;
  return {
    businessDecoded: JSON.stringify(projected.businessValue, null, 2),
    displayDecoded: JSON.stringify(projected.displayValue, null, 2),
    headers,
  };
};
