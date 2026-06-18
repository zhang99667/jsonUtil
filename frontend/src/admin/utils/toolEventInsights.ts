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

export type ToolEventWeeklyTone = 'success' | 'warning' | 'danger' | 'info';

export interface ToolEventWeeklyMetric {
    key: string;
    label: string;
    value: string;
    helper: string;
    tone: ToolEventWeeklyTone;
}

export interface ToolEventWeeklyFocus {
    key: string;
    title: string;
    description: string;
    tone: ToolEventWeeklyTone;
}

export interface ToolEventWeeklyReport {
    periodLabel: string;
    headline: string;
    metrics: ToolEventWeeklyMetric[];
    focusItems: ToolEventWeeklyFocus[];
    actionItems: string[];
    isEmpty: boolean;
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

const formatPeriodLabel = (days: number): string => (
    days <= 1 ? '今日' : `近 ${days} 天`
);

const formatCount = (count: number): string => (
    count.toLocaleString('zh-CN')
);

const getTopGroup = (items: ToolEventGroupItem[] = []): ToolEventGroupItem | null => (
    items.length > 0 ? items[0] : null
);

export const buildToolEventWeeklyReport = (
    stats: ToolEventStats | null,
    days: number,
    formatLabel: (label: string) => string = label => label
): ToolEventWeeklyReport => {
    const periodLabel = formatPeriodLabel(days);
    const insights = buildToolEventInsights(stats);
    const topEvent = getTopGroup(stats?.topEvents);
    const topInputSize = getTopGroup(stats?.inputSizeDistribution);
    const topDuration = getTopGroup(stats?.durationDistribution);
    const topEventLabel = topEvent ? formatLabel(topEvent.label) : '';
    const totalEvents = stats?.totalEvents || 0;

    if (!stats || totalEvents === 0) {
        return {
            periodLabel,
            headline: `${periodLabel}暂无工具事件，先确认主工具埋点覆盖和后台数据链路。`,
            metrics: [
                { key: 'total', label: '工具事件', value: '0', helper: '本周期暂无上报', tone: 'info' },
                { key: 'top', label: '高频功能', value: '-', helper: '暂无可判断功能', tone: 'info' },
                { key: 'failure', label: '失败率', value: '0%', helper: '暂无失败样本', tone: 'info' },
                { key: 'slow', label: '慢操作', value: '0%', helper: '暂无耗时样本', tone: 'info' },
            ],
            focusItems: [{
                key: 'empty',
                title: '埋点覆盖待确认',
                description: '本周期没有工具事件，上线或灰度后先确认主工具事件是否正常进入后台。',
                tone: 'info',
            }],
            actionItems: [
                '确认 `/api/visitor/events` 请求是否正常返回',
                '用主工具执行一次格式化、Scheme 解析和 JSONPath 查询后再刷新后台',
            ],
            isEmpty: true,
        };
    }

    const focusItems: ToolEventWeeklyFocus[] = [];
    const actionItems: string[] = [];

    if ((stats.failureRate || 0) >= 5) {
        focusItems.push({
            key: 'failure',
            title: '失败率偏高',
            description: `失败率 ${stats.failureRate}%，需要优先排查失败事件是否集中在高频功能或 AI/文件链路。`,
            tone: 'danger',
        });
        actionItems.push('优先排查失败事件，必要时按功能补充错误分桶或前端提示');
    }

    if (insights.slowPercentage >= 10) {
        focusItems.push({
            key: 'slow',
            title: '慢操作偏多',
            description: `${formatCount(insights.slowEvents)} 次操作超过 2 秒，优先关注大 response 解析和 Worker 调度。`,
            tone: 'warning',
        });
        actionItems.push('对慢操作集中的功能补充性能预算或拆分 Worker 任务');
    }

    if (insights.largeInputPercentage >= 25) {
        focusItems.push({
            key: 'large-input',
            title: '大输入占比较高',
            description: `${formatCount(insights.largeInputEvents)} 次输入超过 50KB，需要持续观察解析取消率和首屏响应。`,
            tone: 'warning',
        });
        actionItems.push('把高频大输入样本脱敏沉淀到 corpus 或浏览器性能预算');
    }

    if (topEvent && topEvent.percentage >= 50) {
        focusItems.push({
            key: 'top-event',
            title: '使用集中在单一功能',
            description: `${topEventLabel} 占 ${topEvent.percentage}%，下周可优先围绕该功能做体验回访。`,
            tone: 'info',
        });
    }

    if (focusItems.length === 0) {
        focusItems.push({
            key: 'stable',
            title: '整体使用稳定',
            description: '失败率、慢操作和大输入占比都在观察阈值内，可继续跟踪高频功能变化。',
            tone: 'success',
        });
        actionItems.push('保留当前埋点口径，继续观察高频功能和输入规模变化');
    }

    if (topEvent && !actionItems.some(item => item.includes('高频'))) {
        actionItems.push('围绕最高频功能复盘入口曝光、复制链路和下一步推荐是否顺手');
    }

    return {
        periodLabel,
        headline: `${periodLabel}共 ${formatCount(totalEvents)} 次工具事件，${insights.recommendation}。`,
        metrics: [
            {
                key: 'total',
                label: '工具事件',
                value: formatCount(totalEvents),
                helper: `成功 ${formatCount(stats.successEvents || 0)} / 失败 ${formatCount(stats.failedEvents || 0)}`,
                tone: 'info',
            },
            {
                key: 'top',
                label: '高频功能',
                value: topEvent ? topEventLabel : '-',
                helper: topEvent ? `${formatCount(topEvent.count)} 次 · ${topEvent.percentage}%` : '暂无排行',
                tone: topEvent && topEvent.percentage >= 50 ? 'warning' : 'info',
            },
            {
                key: 'failure',
                label: '失败率',
                value: `${stats.failureRate || 0}%`,
                helper: `${formatCount(stats.failedEvents || 0)} 次失败`,
                tone: (stats.failureRate || 0) >= 5 ? 'danger' : 'success',
            },
            {
                key: 'scale',
                label: '大输入 / 慢操作',
                value: `${insights.largeInputPercentage}% / ${insights.slowPercentage}%`,
                helper: `${topInputSize ? formatLabel(topInputSize.label) : '未知大小'} · ${topDuration ? formatLabel(topDuration.label) : '未知耗时'}`,
                tone: insights.largeInputPercentage >= 25 || insights.slowPercentage >= 10 ? 'warning' : 'success',
            },
        ],
        focusItems: focusItems.slice(0, 3),
        actionItems: actionItems.slice(0, 3),
        isEmpty: false,
    };
};
