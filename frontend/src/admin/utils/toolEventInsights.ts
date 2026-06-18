import type { ToolEventGroupItem, ToolEventStats } from '../services/traffic';

const LARGE_INPUT_BUCKETS = new Set(['50_250kb', '250kb_1mb', 'gt_1mb']);
const SLOW_DURATION_BUCKETS = new Set(['2_10s', 'gt_10s']);

export interface ToolEventInsights {
    totalEvents: number;
    topEventLabel: string | null;
    topEventCount: number;
    topEventPercentage: number;
    largeInputEvents: number;
    largeInputPercentage: number;
    slowEvents: number;
    slowPercentage: number;
    recommendation: string;
}

const sumGroups = (items: ToolEventGroupItem[], targetLabels: Set<string>): number => (
    items
        .filter(item => targetLabels.has(item.label))
        .reduce((sum, item) => sum + item.count, 0)
);

const percent = (count: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }
    return Math.round(count * 10000 / total) / 100;
};

const buildRecommendation = (
    stats: ToolEventStats | null,
    largeInputPercentage: number,
    slowPercentage: number
): string => {
    if (!stats || stats.totalEvents === 0) {
        return '暂无工具事件，先观察埋点覆盖';
    }
    if (stats.failureRate >= 5) {
        return '失败率偏高，优先排查失败事件';
    }
    if (slowPercentage >= 10) {
        return '慢操作偏多，优先看大输入解析耗时';
    }
    if (largeInputPercentage >= 25) {
        return '大输入占比较高，关注 Worker 预算';
    }
    return '使用稳定，继续跟踪高频功能';
};

export const buildToolEventInsights = (stats: ToolEventStats | null): ToolEventInsights => {
    const totalEvents = stats?.totalEvents || 0;
    const topEvent = stats?.topEvents?.[0] || null;
    const largeInputEvents = stats ? sumGroups(stats.inputSizeDistribution || [], LARGE_INPUT_BUCKETS) : 0;
    const slowEvents = stats ? sumGroups(stats.durationDistribution || [], SLOW_DURATION_BUCKETS) : 0;
    const largeInputPercentage = percent(largeInputEvents, totalEvents);
    const slowPercentage = percent(slowEvents, totalEvents);

    return {
        totalEvents,
        topEventLabel: topEvent?.label || null,
        topEventCount: topEvent?.count || 0,
        topEventPercentage: topEvent?.percentage || 0,
        largeInputEvents,
        largeInputPercentage,
        slowEvents,
        slowPercentage,
        recommendation: buildRecommendation(stats, largeInputPercentage, slowPercentage),
    };
};
