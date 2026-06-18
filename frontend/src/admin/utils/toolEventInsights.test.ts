import { describe, expect, it } from 'vitest';
import { buildToolEventInsights, buildToolEventWeeklyReport } from './toolEventInsights';
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

    it('周报空数据提示确认埋点覆盖', () => {
        const report = buildToolEventWeeklyReport(null, 7);

        expect(report.periodLabel).toBe('近 7 天');
        expect(report.isEmpty).toBe(true);
        expect(report.headline).toContain('暂无工具事件');
        expect(report.metrics).toHaveLength(4);
        expect(report.focusItems[0]).toMatchObject({
            key: 'empty',
            tone: 'info',
        });
        expect(report.actionItems).toContain('确认 `/api/visitor/events` 请求是否正常返回');
    });

    it('周报聚合失败、慢操作和大输入关注点', () => {
        const report = buildToolEventWeeklyReport(baseStats({
            totalEvents: 200,
            successEvents: 180,
            failedEvents: 20,
            failureRate: 10,
            topEvents: [{ label: 'SCHEME_PANEL_OPEN', count: 120, percentage: 60 }],
            inputSizeDistribution: [
                { label: 'lt_10kb', count: 80, percentage: 40 },
                { label: '50_250kb', count: 60, percentage: 30 },
            ],
            durationDistribution: [
                { label: '2_10s', count: 24, percentage: 12 },
            ],
        }), 7);

        expect(report.isEmpty).toBe(false);
        expect(report.headline).toContain('近 7 天共 200 次工具事件');
        expect(report.metrics.find(item => item.key === 'top')).toMatchObject({
            value: 'SCHEME_PANEL_OPEN',
            tone: 'warning',
        });
        expect(report.metrics.find(item => item.key === 'scale')?.value).toBe('30% / 12%');
        expect(report.focusItems.map(item => item.key)).toEqual(['failure', 'slow', 'large-input']);
        expect(report.actionItems).toContain('优先排查失败事件，必要时按功能补充错误分桶或前端提示');
    });

    it('周报支持业务标签格式化', () => {
        const report = buildToolEventWeeklyReport(baseStats({
            totalEvents: 200,
            successEvents: 190,
            failedEvents: 10,
            failureRate: 5,
            topEvents: [{ label: 'SCHEME_PANEL_OPEN', count: 120, percentage: 60 }],
            inputSizeDistribution: [{ label: '50_250kb', count: 60, percentage: 30 }],
            durationDistribution: [{ label: '2_10s', count: 24, percentage: 12 }],
        }), 7, label => ({
            SCHEME_PANEL_OPEN: '打开 Scheme 面板',
            '50_250kb': '50-250KB',
            '2_10s': '2-10s',
        }[label] || label));

        expect(report.metrics.find(item => item.key === 'top')?.value).toBe('打开 Scheme 面板');
        expect(report.metrics.find(item => item.key === 'scale')?.helper).toBe('50-250KB · 2-10s');
    });

    it('周报健康数据给出稳定复盘动作', () => {
        const report = buildToolEventWeeklyReport(baseStats({
            inputSizeDistribution: [{ label: 'lt_10kb', count: 90, percentage: 90 }],
            durationDistribution: [{ label: '100_500ms', count: 80, percentage: 80 }],
        }), 1);

        expect(report.periodLabel).toBe('今日');
        expect(report.focusItems[0]).toMatchObject({
            key: 'stable',
            tone: 'success',
        });
        expect(report.metrics.find(item => item.key === 'failure')).toMatchObject({
            value: '4%',
            tone: 'success',
        });
        expect(report.actionItems[0]).toBe('保留当前埋点口径，继续观察高频功能和输入规模变化');
    });
});
