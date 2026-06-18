import { describe, expect, it } from 'vitest';
import { buildToolEventInsights } from './toolEventInsights';
import type { ToolEventStats } from '../services/traffic';

const baseStats = (overrides: Partial<ToolEventStats> = {}): ToolEventStats => ({
    totalEvents: 100,
    successEvents: 96,
    failedEvents: 4,
    failureRate: 4,
    topEvents: [{ label: 'DEEP_FORMAT', count: 40, percentage: 40 }],
    statusDistribution: [],
    inputSizeDistribution: [],
    durationDistribution: [],
    ...overrides,
});

describe('toolEventInsights', () => {
    it('空数据给出埋点覆盖提示', () => {
        expect(buildToolEventInsights(null)).toEqual({
            totalEvents: 0,
            topEventLabel: null,
            topEventCount: 0,
            topEventPercentage: 0,
            largeInputEvents: 0,
            largeInputPercentage: 0,
            slowEvents: 0,
            slowPercentage: 0,
            recommendation: '暂无工具事件，先观察埋点覆盖',
        });
    });

    it('聚合大输入和慢操作分桶', () => {
        const insights = buildToolEventInsights(baseStats({
            inputSizeDistribution: [
                { label: 'lt_10kb', count: 50, percentage: 50 },
                { label: '50_250kb', count: 20, percentage: 20 },
                { label: '250kb_1mb', count: 5, percentage: 5 },
                { label: 'gt_1mb', count: 5, percentage: 5 },
            ],
            durationDistribution: [
                { label: '500ms_2s', count: 8, percentage: 8 },
                { label: '2_10s', count: 7, percentage: 7 },
                { label: 'gt_10s', count: 3, percentage: 3 },
            ],
        }));

        expect(insights.topEventLabel).toBe('DEEP_FORMAT');
        expect(insights.largeInputEvents).toBe(30);
        expect(insights.largeInputPercentage).toBe(30);
        expect(insights.slowEvents).toBe(10);
        expect(insights.slowPercentage).toBe(10);
        expect(insights.recommendation).toBe('慢操作偏多，优先看大输入解析耗时');
    });

    it('失败率风险优先级高于大输入风险', () => {
        const insights = buildToolEventInsights(baseStats({
            failedEvents: 8,
            failureRate: 8,
            inputSizeDistribution: [
                { label: 'gt_1mb', count: 30, percentage: 30 },
            ],
        }));

        expect(insights.recommendation).toBe('失败率偏高，优先排查失败事件');
    });

    it('健康数据给出稳定观察建议', () => {
        const insights = buildToolEventInsights(baseStats({
            inputSizeDistribution: [{ label: 'lt_10kb', count: 90, percentage: 90 }],
            durationDistribution: [{ label: '100_500ms', count: 80, percentage: 80 }],
        }));

        expect(insights.largeInputPercentage).toBe(0);
        expect(insights.slowPercentage).toBe(0);
        expect(insights.recommendation).toBe('使用稳定，继续跟踪高频功能');
    });
});
