import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useTrafficStatsData } from '../hooks/useTrafficStatsData';
import TrafficStats from './TrafficStats';

vi.mock('@ant-design/charts', () => ({
    Column: () => null,
}));

vi.mock('../hooks/useTrafficStatsData', () => ({
    useTrafficStatsData: vi.fn(),
}));

const mockUseTrafficStatsData = vi.mocked(useTrafficStatsData);
type TrafficStatsData = ReturnType<typeof useTrafficStatsData>;

const createTrafficStatsData = (overrides: Partial<TrafficStatsData> = {}): TrafficStatsData => ({
    loading: false,
    overview: {
        totalPv: 120,
        totalUv: 80,
        todayPv: 60,
        todayUv: 37,
        avgDailyPv: 40,
        avgDailyUv: 25,
        days: 1,
    },
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
    failedSections: [],
    ...overrides,
});

describe('TrafficStats', () => {
    it('独立 IP 数使用概览数据且不影响 IP 排行', () => {
        mockUseTrafficStatsData.mockReturnValue(createTrafficStatsData({
            topIps: [
                { ip: '192.0.2.1', count: 12, region: '北京' },
                { ip: '198.51.100.2', count: 8, region: '上海' },
            ],
        }));

        const markup = renderToStaticMarkup(<TrafficStats />);

        expect(markup).toMatch(/独立IP数[\s\S]*?ant-statistic-content-value[^>]*>37<\/span>/);
        expect(markup).toContain('192.0.2.1');
        expect(markup).toContain('198.51.100.2');
    });

    it('工具洞察保留业务标签、分桶和周报语义', () => {
        mockUseTrafficStatsData.mockReturnValue(createTrafficStatsData({
            toolEventStats: {
                totalEvents: 100,
                successEvents: 94,
                failedEvents: 6,
                failureRate: 6,
                topEvents: [{ label: 'DEEP_FORMAT', count: 40, percentage: 40 }],
                statusDistribution: [],
                inputSizeDistribution: [{ label: '50_250kb', count: 30, percentage: 30 }],
                durationDistribution: [{ label: '2_10s', count: 12, percentage: 12 }],
            },
        }));

        const markup = renderToStaticMarkup(<TrafficStats />);

        expect(markup).toContain('工具使用洞察');
        expect(markup).toContain('嵌套解析');
        expect(markup).toContain('50-250KB');
        expect(markup).toContain('PM 周报 · 今日');
        expect(markup).toContain('失败率偏高');
    });
});
