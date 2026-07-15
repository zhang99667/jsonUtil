import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import {
  TRAFFIC_STATS_SECTIONS,
  beginTrafficStatsLoad,
  completeTrafficStatsLoad,
  createTrafficStatsState,
  loadTrafficStatsData,
  runTrafficStatsDataRequest,
} from './useTrafficStatsData';
import type { TrafficStatsLoadResult } from './useTrafficStatsData';

vi.mock('../services/traffic', () => ({
  getTrafficOverview: vi.fn(),
  getTrafficTrend: vi.fn(),
  getTopIps: vi.fn(),
  getTopPaths: vi.fn(),
  getHourlyStats: vi.fn(),
  getGeoDistribution: vi.fn(),
  getDeviceDistribution: vi.fn(),
  getBrowserDistribution: vi.fn(),
  getRefererDistribution: vi.fn(),
  getSessionDuration: vi.fn(),
  getToolEventStats: vi.fn(),
}));

const overview = {
  totalPv: 120,
  totalUv: 80,
  todayPv: 20,
  todayUv: 12,
  avgDailyPv: 17,
  avgDailyUv: 11,
  days: 7,
};
const trend = [{ date: '2026-07-13', pv: 20, uv: 12 }];
const topIps = [{ ip: '127.0.0.1', count: 8, region: '本地' }];
const topPaths = [{ path: '/', count: 18 }];
const hourlyStats = [{ hour: 9, count: 7 }];
const geoStats = [{ region: '北京', count: 12, percentage: 60 }];
const deviceStats = [{ device: 'Desktop', browser: null, count: 10, percentage: 50 }];
const browserStats = [{ device: null, browser: 'Chrome', count: 9, percentage: 45 }];
const refererStats = [{ source: '直接访问', domain: null, count: 14, percentage: 70 }];
const sessionStats = [{ durationRange: '0-30秒', count: 11, percentage: 55 }];
const toolEventStats = {
  totalEvents: 10,
  successEvents: 9,
  failedEvents: 1,
  failureRate: 10,
  topEvents: [],
  statusDistribution: [],
  inputSizeDistribution: [],
  durationDistribution: [],
};

const configureSuccessfulRequests = () => {
  vi.mocked(getTrafficOverview).mockResolvedValue(overview);
  vi.mocked(getTrafficTrend).mockResolvedValue(trend);
  vi.mocked(getTopIps).mockResolvedValue(topIps);
  vi.mocked(getTopPaths).mockResolvedValue(topPaths);
  vi.mocked(getHourlyStats).mockResolvedValue(hourlyStats);
  vi.mocked(getGeoDistribution).mockResolvedValue(geoStats);
  vi.mocked(getDeviceDistribution).mockResolvedValue(deviceStats);
  vi.mocked(getBrowserDistribution).mockResolvedValue(browserStats);
  vi.mocked(getRefererDistribution).mockResolvedValue(refererStats);
  vi.mocked(getSessionDuration).mockResolvedValue(sessionStats);
  vi.mocked(getToolEventStats).mockResolvedValue(toolEventStats);
};

const createDeferred = <T>() => {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });
  return { promise, resolvePromise };
};

describe('useTrafficStatsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureSuccessfulRequests();
  });

  it('并发加载全部流量接口并使用固定排行上限', async () => {
    const result = await loadTrafficStatsData(7);

    expect(result).toEqual({
      data: {
        overview,
        trend,
        topIps,
        topPaths,
        hourlyStats,
        geoStats,
        deviceStats,
        browserStats,
        refererStats,
        sessionStats,
        toolEventStats,
      },
      failedSections: [],
    });
    expect(getTrafficOverview).toHaveBeenCalledWith(7);
    expect(getTopIps).toHaveBeenCalledWith(7, 10);
    expect(getTopPaths).toHaveBeenCalledWith(7, 10);
    expect(getGeoDistribution).toHaveBeenCalledWith(7, 15);
    expect(getDeviceDistribution).toHaveBeenCalledWith(7, 10);
    expect(getBrowserDistribution).toHaveBeenCalledWith(7, 10);
    expect(getRefererDistribution).toHaveBeenCalledWith(7, 10);
    expect(getToolEventStats).toHaveBeenCalledWith(7, 10);
  });

  it('单个接口同步失败时仍返回其他接口的成功结果', async () => {
    vi.mocked(getTrafficTrend).mockImplementationOnce(() => {
      throw new Error('趋势接口失败');
    });

    const result = await loadTrafficStatsData(7);

    expect(result.failedSections).toEqual(['trend']);
    expect(result.data).not.toHaveProperty('trend');
    expect(result.data.overview).toEqual(overview);
    expect(result.data.geoStats).toEqual(geoStats);
    expect(result.data.toolEventStats).toEqual(toolEventStats);
  });

  it('同范围后台刷新保留旧数据而切换范围会立即清空', () => {
    const started = beginTrafficStatsLoad(createTrafficStatsState(), 7);
    const loaded = completeTrafficStatsLoad(started, 7, {
      data: { overview, trend },
      failedSections: ['geoStats'],
    });

    const refreshing = beginTrafficStatsLoad(loaded, 7);
    expect(refreshing.loading).toBe(false);
    expect(refreshing.data.overview).toEqual(overview);
    expect(refreshing.data.trend).toEqual(trend);
    expect(refreshing.failedSections).toEqual(['geoStats']);

    const switched = beginTrafficStatsLoad(refreshing, 30);
    expect(switched.loading).toBe(true);
    expect(switched.data.overview).toBeNull();
    expect(switched.data.trend).toEqual([]);
    expect(switched.failedSections).toEqual([]);

    const emptyLoaded = completeTrafficStatsLoad(
      beginTrafficStatsLoad(createTrafficStatsState(), 1),
      1,
      { data: {}, failedSections: [] },
    );
    expect(beginTrafficStatsLoad(emptyLoaded, 1).loading).toBe(false);
  });

  it('较早统计范围晚返回时不会覆盖最新请求', async () => {
    const first = createDeferred<TrafficStatsLoadResult>();
    const second = createDeferred<TrafficStatsLoadResult>();
    const requestIdRef = { current: 0 };
    const onStart = vi.fn();
    const onComplete = vi.fn();
    const loadData = vi.fn((days: number) => days === 1 ? first.promise : second.promise);

    const firstTask = runTrafficStatsDataRequest({
      days: 1,
      requestIdRef,
      onStart,
      onComplete,
      loadData,
    });
    const secondTask = runTrafficStatsDataRequest({
      days: 7,
      requestIdRef,
      onStart,
      onComplete,
      loadData,
    });

    const latestResult = { data: { overview }, failedSections: [] };
    second.resolvePromise(latestResult);
    await expect(secondTask).resolves.toBe(true);
    first.resolvePromise({ data: { overview: { ...overview, totalPv: 1 } }, failedSections: [] });
    await expect(firstTask).resolves.toBe(false);

    expect(onStart).toHaveBeenNthCalledWith(1, 1);
    expect(onStart).toHaveBeenNthCalledWith(2, 7);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(7, latestResult);
  });

  it('编排器异常时结束当前请求并标记全部分区失败', async () => {
    const requestIdRef = { current: 0 };
    const onComplete = vi.fn();

    await expect(runTrafficStatsDataRequest({
      days: 7,
      requestIdRef,
      onStart: vi.fn(),
      onComplete,
      loadData: vi.fn().mockRejectedValue(new Error('编排异常')),
    })).resolves.toBe(true);

    expect(onComplete).toHaveBeenCalledWith(7, {
      data: {},
      failedSections: [...TRAFFIC_STATS_SECTIONS],
    });
  });
});
