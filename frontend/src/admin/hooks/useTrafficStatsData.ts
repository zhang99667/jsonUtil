import { useEffect, useRef, useState } from 'react';
import {
  getBrowserDistribution,
  getDeviceDistribution,
  getGeoDistribution,
  getHourlyStats,
  getRefererDistribution,
  getSessionDuration,
  getToolEventStats,
  getTopIps,
  getTopPaths,
  getTrafficOverview,
  getTrafficTrend,
} from '../services/traffic';
import type {
  DeviceStatsItem,
  GeoStatsItem,
  HourlyItem,
  RefererStatsItem,
  SessionStatsItem,
  ToolEventStats,
  TopIpItem,
  TopPathItem,
  TrafficOverview,
  TrendItem,
} from '../services/traffic';
import type { MutableValueRef } from '../../utils/mutableValueRef';

export interface TrafficStatsData {
  overview: TrafficOverview | null;
  trend: TrendItem[];
  topIps: TopIpItem[];
  topPaths: TopPathItem[];
  hourlyStats: HourlyItem[];
  geoStats: GeoStatsItem[];
  deviceStats: DeviceStatsItem[];
  browserStats: DeviceStatsItem[];
  refererStats: RefererStatsItem[];
  sessionStats: SessionStatsItem[];
  toolEventStats: ToolEventStats | null;
}

export type TrafficStatsSection = keyof TrafficStatsData;

export const TRAFFIC_STATS_SECTIONS = [
  'overview',
  'trend',
  'topIps',
  'topPaths',
  'hourlyStats',
  'geoStats',
  'deviceStats',
  'browserStats',
  'refererStats',
  'sessionStats',
  'toolEventStats',
] as const satisfies readonly TrafficStatsSection[];

export interface TrafficStatsLoadResult {
  data: Partial<TrafficStatsData>;
  failedSections: TrafficStatsSection[];
}

export interface TrafficStatsState {
  rangeDays: number | null;
  data: TrafficStatsData;
  loading: boolean;
  hasCompleted: boolean;
  failedSections: TrafficStatsSection[];
}

type TrafficStatsRequest = {
  [Section in TrafficStatsSection]: {
    section: Section;
    load: () => Promise<TrafficStatsData[Section]>;
  };
}[TrafficStatsSection];

type TrafficStatsLoader = (days: number) => Promise<TrafficStatsLoadResult>;

interface RunTrafficStatsRequestInput {
  days: number;
  requestIdRef: MutableValueRef<number>;
  onStart: (days: number) => void;
  onComplete: (days: number, result: TrafficStatsLoadResult) => void;
  loadData?: TrafficStatsLoader;
}

const createEmptyTrafficStatsData = (): TrafficStatsData => ({
  overview: null,
  trend: [],
  topIps: [],
  topPaths: [],
  hourlyStats: [],
  geoStats: [],
  deviceStats: [],
  browserStats: [],
  refererStats: [],
  sessionStats: [],
  toolEventStats: null,
});

const createTrafficStatsRequests = (days: number): readonly TrafficStatsRequest[] => [
  { section: 'overview', load: () => getTrafficOverview(days) },
  { section: 'trend', load: () => getTrafficTrend(days) },
  { section: 'topIps', load: () => getTopIps(days, 10) },
  { section: 'topPaths', load: () => getTopPaths(days, 10) },
  { section: 'hourlyStats', load: () => getHourlyStats(days) },
  { section: 'geoStats', load: () => getGeoDistribution(days, 15) },
  { section: 'deviceStats', load: () => getDeviceDistribution(days, 10) },
  { section: 'browserStats', load: () => getBrowserDistribution(days, 10) },
  { section: 'refererStats', load: () => getRefererDistribution(days, 10) },
  { section: 'sessionStats', load: () => getSessionDuration(days) },
  { section: 'toolEventStats', load: () => getToolEventStats(days, 10) },
];

export const createTrafficStatsState = (): TrafficStatsState => ({
  rangeDays: null,
  data: createEmptyTrafficStatsData(),
  loading: true,
  hasCompleted: false,
  failedSections: [],
});

export const beginTrafficStatsLoad = (
  state: TrafficStatsState,
  days: number,
): TrafficStatsState => {
  const sameRange = state.rangeDays === days;
  const data = sameRange ? state.data : createEmptyTrafficStatsData();
  const hasCompleted = sameRange && state.hasCompleted;

  return {
    rangeDays: days,
    data,
    loading: !hasCompleted,
    hasCompleted,
    failedSections: sameRange ? state.failedSections : [],
  };
};

export const completeTrafficStatsLoad = (
  state: TrafficStatsState,
  days: number,
  result: TrafficStatsLoadResult,
): TrafficStatsState => {
  if (state.rangeDays !== days) {
    return state;
  }

  return {
    rangeDays: days,
    data: { ...state.data, ...result.data },
    loading: false,
    hasCompleted: true,
    failedSections: result.failedSections,
  };
};

export const loadTrafficStatsData: TrafficStatsLoader = async days => {
  const requests = createTrafficStatsRequests(days);
  const results = await Promise.allSettled(
    requests.map(request => Promise.resolve().then(
      (): Promise<unknown> => request.load(),
    )),
  );
  const data = Object.fromEntries(requests.flatMap((request, index) => {
    const result = results[index];
    return result.status === 'fulfilled' ? [[request.section, result.value]] : [];
  })) as Partial<TrafficStatsData>;
  const failedSections = requests.flatMap((request, index) => (
    results[index].status === 'rejected' ? [request.section] : []
  ));

  return { data, failedSections };
};

export const runTrafficStatsDataRequest = async ({
  days,
  requestIdRef,
  onStart,
  onComplete,
  loadData = loadTrafficStatsData,
}: RunTrafficStatsRequestInput): Promise<boolean> => {
  const requestId = ++requestIdRef.current;
  onStart(days);

  let result: TrafficStatsLoadResult;
  try {
    result = await loadData(days);
  } catch {
    result = {
      data: {},
      failedSections: [...TRAFFIC_STATS_SECTIONS],
    };
  }

  if (requestId !== requestIdRef.current) {
    return false;
  }

  onComplete(days, result);
  return true;
};

export const useTrafficStatsData = (days: number) => {
  const [state, setState] = useState<TrafficStatsState>(createTrafficStatsState);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const refresh = () => {
      void runTrafficStatsDataRequest({
        days,
        requestIdRef,
        onStart: requestDays => {
          setState(current => beginTrafficStatsLoad(current, requestDays));
        },
        onComplete: (requestDays, result) => {
          setState(current => completeTrafficStatsLoad(current, requestDays, result));
        },
      });
    };

    refresh();
    const intervalId = days === 1 ? setInterval(refresh, 5 * 60 * 1000) : null;

    return () => {
      requestIdRef.current += 1;
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [days]);

  return {
    ...state.data,
    loading: state.loading,
    failedSections: state.failedSections,
  };
};
