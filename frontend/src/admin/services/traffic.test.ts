import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMocks = vi.hoisted(() => ({
    get: vi.fn(),
}));

vi.mock('./request', () => ({
    default: requestMocks,
}));

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
} from './traffic';

type TrafficRequestCase = readonly [
    name: string,
    run: () => Promise<unknown>,
    path: string,
    params: Record<string, number>,
];

const trafficRequestCases: TrafficRequestCase[] = [
    ['流量概览', () => getTrafficOverview(7), '/admin/traffic/overview', { days: 7 }],
    ['流量趋势', () => getTrafficTrend(30), '/admin/traffic/trend', { days: 30 }],
    ['IP 排行', () => getTopIps(7, 5), '/admin/traffic/top-ips', { days: 7, limit: 5 }],
    ['路径排行', () => getTopPaths(7, 6), '/admin/traffic/top-paths', { days: 7, limit: 6 }],
    ['小时分布', () => getHourlyStats(7), '/admin/traffic/hourly', { days: 7 }],
    ['地区分布', () => getGeoDistribution(7), '/admin/traffic/geo-distribution', { days: 7, limit: 15 }],
    ['设备分布', () => getDeviceDistribution(7), '/admin/traffic/device-distribution', { days: 7, limit: 10 }],
    ['浏览器分布', () => getBrowserDistribution(7), '/admin/traffic/browser-distribution', { days: 7, limit: 10 }],
    ['来源分布', () => getRefererDistribution(7), '/admin/traffic/referer-distribution', { days: 7, limit: 10 }],
    ['会话时长', () => getSessionDuration(7), '/admin/traffic/session-duration', { days: 7 }],
    ['工具事件', () => getToolEventStats(7), '/admin/traffic/tool-events', { days: 7, limit: 10 }],
];

describe('流量统计服务', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(trafficRequestCases)('%s 使用约定端点和查询参数', async (_name, run, path, params) => {
        const response = { ok: true };
        requestMocks.get.mockResolvedValue(response);

        await expect(run()).resolves.toBe(response);
        expect(requestMocks.get).toHaveBeenCalledWith(path, { params });
    });
});
