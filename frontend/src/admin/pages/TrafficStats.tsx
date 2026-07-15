import React, { Suspense, lazy, useState, useCallback, useMemo } from 'react';
import { Row, Col, Card as AntCard, Spin, Table, Segmented, Progress, Tooltip, Typography, Tag, theme } from 'antd';
import {
    EyeOutlined,
    TeamOutlined,
    RiseOutlined,
    GlobalOutlined,
    LinkOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    BarChartOutlined,
    LaptopOutlined,
    ChromeOutlined,
    ShareAltOutlined,
    FieldTimeOutlined,
    WarningOutlined
} from '@ant-design/icons';

const { Title } = Typography;
import type { CardProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DistributionList, DistributionListCard } from '../components/DistributionListCard';
import { useTrafficStatsData } from '../hooks/useTrafficStatsData';
import type {
    TopIpItem,
    TopPathItem,
    GeoStatsItem,
    ToolEventGroupItem,
} from '../services/traffic';
import {
    buildToolEventInsights,
    buildToolEventWeeklyReport,
    formatAdminCount,
    type ToolEventWeeklyTone,
} from '../utils/toolEventInsights';
import { chartThemeColors, gradients } from '../styles/theme';

const Card = AntCard as React.ComponentType<React.PropsWithChildren<CardProps>>;
const RANK_BADGE_GRADIENTS = [gradients.blue, gradients.violet, gradients.emerald] as const;

const LazyColumn = lazy(async () => {
    const { Column } = await import('@ant-design/charts');
    return { default: Column as React.ComponentType<Record<string, unknown>> };
});

/** 图表库按需加载占位，避免页面切换时整页闪空 */
const ChartFallback: React.FC<{ height: number }> = ({ height }) => (
    <div
        style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
    >
        <Spin size="small" />
    </div>
);

const TrafficStats: React.FC = () => {
    const [days, setDays] = useState<number>(1); // 默认今日
    const { token } = theme.useToken();
    const {
        loading,
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
        failedSections,
    } = useTrafficStatsData(days);

    const isToday = days === 1;

    /**
     * 渲染排名徽章
     * 前3名使用渐变徽章，其余使用普通灰色文字
     */
    const renderRankBadge = (index: number) => {
        const rank = index + 1;
        const background = RANK_BADGE_GRADIENTS[index];
        if (!background) {
            return <span style={{ color: chartThemeColors.muted, fontSize: 13 }}>{rank}</span>;
        }

        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%',
                background,
                color: token.colorTextLightSolid, fontSize: 11, fontWeight: 600,
            }}>
                {rank}
            </span>
        );
    };

    // 访问地址排行表格列配置
    const ipColumns: ColumnsType<TopIpItem> = [
        {
            title: '排名',
            key: 'rank',
            width: 60,
            render: (_, __, index) => renderRankBadge(index),
        },
        {
            title: 'IP地址',
            dataIndex: 'ip',
            key: 'ip',
            ellipsis: true,
        },
        {
            title: '地区',
            dataIndex: 'region',
            key: 'region',
            width: 100,
            render: (region: string) => (
                <span>
                    <EnvironmentOutlined style={{ marginRight: 4, color: '#5B6EF5' }} />
                    {region || '未知'}
                </span>
            ),
        },
        {
            title: '访问次数',
            dataIndex: 'count',
            key: 'count',
            width: 100,
            align: 'right',
            render: (count: number) => formatAdminCount(count),
        },
    ];

    // 路径排行表格列配置
    const pathColumns: ColumnsType<TopPathItem> = [
        {
            title: '排名',
            key: 'rank',
            width: 60,
            render: (_, __, index) => renderRankBadge(index),
        },
        {
            title: '访问路径',
            dataIndex: 'path',
            key: 'path',
            ellipsis: true,
            render: (path: string) => (
                <Tooltip title={path}>
                    <span>{path}</span>
                </Tooltip>
            ),
        },
        {
            title: '访问次数',
            dataIndex: 'count',
            key: 'count',
            width: 100,
            align: 'right',
            render: (count: number) => formatAdminCount(count),
        },
    ];

    // 计算地区分布最大值（用于 Progress 百分比），避免大数组展开造成调用栈溢出
    const maxGeoCount = useMemo(() => geoStats.reduce((max, item) => Math.max(max, item.count), 1), [geoStats]);

    // 每日趋势图数据转换（分组柱状图需要）
    const trendChartData = useMemo(() => trend.flatMap(item => [
        { date: item.date.slice(5), type: 'PV', value: item.pv },
        { date: item.date.slice(5), type: 'UV', value: item.uv },
    ]), [trend]);

    // 24小时分布数据
    const hourlyChartData = useMemo(() => Array.from({ length: 24 }, (_, hour) => {
        const item = hourlyStats.find(h => h.hour === hour);
        return { hour: `${hour}:00`, count: item?.count || 0 };
    }), [hourlyStats]);

    const toolEventLabelMap = useMemo<Record<string, string>>(() => ({
        FORMAT: '格式化',
        DEEP_FORMAT: '嵌套解析',
        MINIFY: '压缩',
        ESCAPE: '转义',
        UNESCAPE: '反转义',
        UNICODE_TO_CN: 'Unicode 转中文',
        CN_TO_UNICODE: '中文转 Unicode',
        URL_ENCODE: 'URL 编码',
        URL_DECODE: 'URL 解码',
        BASE64_ENCODE: 'Base64 编码',
        BASE64_DECODE: 'Base64 解码',
        SORT_KEYS: 'Key 排序',
        AI_FIX: 'AI 修复',
        SAVE: '保存',
        SAVE_SHORTCUT: '快捷键保存',
        SOURCE_PASTE: '粘贴源内容',
        SOURCE_COPY: '复制源内容',
        SOURCE_CLEAR: '清空源内容',
        PREVIEW_COPY: '复制预览内容',
        PREVIEW_APPLY_TO_SOURCE: '预览应用到源',
        OPEN: '打开文件',
        NEW_TAB: '新建标签',
        JSONPATH_OPEN: '打开 JSONPath',
        JSONPATH_CLOSE: '关闭 JSONPath',
        JSONPATH_LOCATE: '定位 JSONPath',
        JSONPATH_QUERY: 'JSONPath 查询',
        STRUCTURE_NAV_LOCATE: '结构导航定位',
        SCHEMA_PANEL_OPEN: '打开 Schema 校验',
        SCHEMA_PANEL_CLOSE: '关闭 Schema 校验',
        SCHEMA_VALIDATE: 'Schema 校验',
        SCHEME_PANEL_OPEN: '打开 Scheme 面板',
        SCHEME_PANEL_CLOSE: '关闭 Scheme 面板',
        SCHEME_OPEN_FROM_REPORT: '报告打开 Scheme',
        SCHEME_OPEN_FROM_SOURCE_STATUS: '状态栏打开 Scheme',
        TEMPLATE_PANEL_OPEN: '打开模板填充',
        TEMPLATE_PANEL_CLOSE: '关闭模板填充',
        TEMPLATE_OPEN_FROM_REPORT: '报告打开模板',
        SETTINGS_OPEN: '打开设置',
        success: '成功',
        error: '失败',
        skipped: '跳过',
        cancelled: '取消',
        empty: '空输入',
        lt_10kb: '< 10KB',
        '10_50kb': '10-50KB',
        '50_250kb': '50-250KB',
        '250kb_1mb': '250KB-1MB',
        gt_1mb: '> 1MB',
        instant: '即时',
        lt_100ms: '< 100ms',
        '100_500ms': '100-500ms',
        '500ms_2s': '0.5-2s',
        '2_10s': '2-10s',
        gt_10s: '> 10s',
        unknown: '未知',
    }), []);

    const getToolEventLabel = useCallback((label: string) => toolEventLabelMap[label] || label, [toolEventLabelMap]);
    const toolEventInsights = useMemo(() => buildToolEventInsights(toolEventStats), [toolEventStats]);
    const toolEventWeeklyReport = useMemo(
        () => buildToolEventWeeklyReport(toolEventStats, days, getToolEventLabel),
        [toolEventStats, days, getToolEventLabel]
    );

    const getWeeklyToneColor = (tone: ToolEventWeeklyTone): string => {
        if (tone === 'success') return chartThemeColors.success;
        if (tone === 'warning') return chartThemeColors.warning;
        if (tone === 'danger') return chartThemeColors.danger;
        return chartThemeColors.primary;
    };

    const getWeeklyToneBackground = (tone: ToolEventWeeklyTone): string => {
        if (tone === 'success') return 'rgba(16,185,129,0.08)';
        if (tone === 'warning') return 'rgba(245,158,11,0.1)';
        if (tone === 'danger') return 'rgba(239,68,68,0.08)';
        return 'rgba(91,110,245,0.08)';
    };

    const renderToolEventList = (items: ToolEventGroupItem[], color: string) => {
        return (
            <DistributionList
                items={items.map(item => ({
                    key: item.label,
                    label: getToolEventLabel(item.label),
                    count: item.count,
                    percentage: item.percentage,
                }))}
                strokeColor={color}
                emptyText="暂无工具事件数据"
                itemGap={12}
                labelGap={12}
                emptyPadding={24}
            />
        );
    };

    // 今日模式下高亮当前时段（移到 useMemo 之后，loading 检查之前）
    const currentHour = new Date().getHours();
    const todayStr = new Date().toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });

    const hourlyChartDataWithHighlight = useMemo(() => hourlyChartData.map(item => ({
        ...item,
        isCurrent: isToday && parseInt(item.hour) === currentHour
    })), [hourlyChartData, isToday, currentHour]);

    // 地区分布表格列配置
    const geoColumns: ColumnsType<GeoStatsItem> = [
        {
            title: '排名',
            key: 'rank',
            width: 60,
            render: (_, __, index) => renderRankBadge(index),
        },
        {
            title: '地区',
            dataIndex: 'region',
            key: 'region',
            render: (region: string) => (
                <span>
                    <EnvironmentOutlined style={{ marginRight: 8, color: '#5B6EF5' }} />
                    {region}
                </span>
            ),
        },
        {
            title: '访问量',
            dataIndex: 'count',
            key: 'count',
            width: 100,
            align: 'right',
            render: (count: number) => formatAdminCount(count),
        },
        {
            title: '占比',
            dataIndex: 'percentage',
            key: 'percentage',
            width: 150,
            render: (percentage: number, record: GeoStatsItem) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Progress
                        percent={Math.round((record.count / maxGeoCount) * 100)}
                        size="small"
                        showInfo={false}
                        strokeColor="#5B6EF5"
                        trailColor="#F0F1F5"
                        style={{ flex: 1, minWidth: 60 }}
                    />
                    <span style={{ minWidth: 45, textAlign: 'right' }}>{percentage}%</span>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            {/* 页面标题 */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChartOutlined style={{ color: '#5B6EF5' }} />
                        流量统计
                    </Title>
                    {isToday && (
                        <>
                            <span style={{ color: '#5A607F', fontSize: 14 }}>{todayStr}</span>
                            <Tag color="purple">实时 · 5分钟刷新</Tag>
                        </>
                    )}
                    {failedSections.length > 0 && (
                        <Tooltip title={`${failedSections.length} 项数据加载失败，已保留其他成功结果`}>
                            <Tag color="orange" icon={<WarningOutlined />}>部分数据不可用</Tag>
                        </Tooltip>
                    )}
                </div>
                <Segmented
                    options={[
                        { label: '今日', value: 1 },
                        { label: '近7天', value: 7 },
                        { label: '近30天', value: 30 },
                    ]}
                    value={days}
                    onChange={(value) => setDays(value as number)}
                />
            </div>

            {/* 概览数据卡片 — 白色圆角卡片 + 圆形图标 */}
            <Row gutter={[16, 16]}>
                {/* PV 浏览量 */}
                <Col xs={24} sm={12} md={6}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(91,110,245,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <EyeOutlined style={{ color: '#5B6EF5', fontSize: 18 }} />
                        </div>
                        <div>
                            <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 4 }}>
                                {isToday ? '今日浏览量 (PV)' : `${days}天总浏览量`}
                            </div>
                            <div style={{ color: '#1A1D2E', fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>
                                {formatAdminCount(isToday ? (overview?.todayPv || 0) : (overview?.totalPv || 0))}
                            </div>
                        </div>
                    </div>
                </Col>
                {/* UV 访客数 */}
                <Col xs={24} sm={12} md={6}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(124,91,245,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <TeamOutlined style={{ color: '#7C5BF5', fontSize: 18 }} />
                        </div>
                        <div>
                            <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 4 }}>
                                {isToday ? '今日访客数 (UV)' : `${days}天总访客数`}
                            </div>
                            <div style={{ color: '#1A1D2E', fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>
                                {formatAdminCount(isToday ? (overview?.todayUv || 0) : (overview?.totalUv || 0))}
                            </div>
                        </div>
                    </div>
                </Col>
                {/* 人均浏览 / 日均PV */}
                <Col xs={24} sm={12} md={6}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(16,185,129,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <RiseOutlined style={{ color: '#10B981', fontSize: 18 }} />
                        </div>
                        <div>
                            <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 4 }}>
                                {isToday ? '人均浏览页数' : '日均PV'}
                            </div>
                            <div style={{ color: '#1A1D2E', fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>
                                {isToday
                                    ? (overview?.todayUv ? (overview.todayPv / overview.todayUv).toFixed(1) : '0')
                                    : formatAdminCount(overview?.avgDailyPv || 0)
                                }
                                {isToday && <span style={{ color: '#9CA3BE', fontSize: 14, fontWeight: 400, marginLeft: 2 }}>页</span>}
                            </div>
                        </div>
                    </div>
                </Col>
                {/* 独立IP / 日均UV */}
                <Col xs={24} sm={12} md={6}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(245,158,11,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <GlobalOutlined style={{ color: '#F59E0B', fontSize: 18 }} />
                        </div>
                        <div>
                            <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 4 }}>
                                {isToday ? '独立IP数' : '日均UV'}
                            </div>
                            <div style={{ color: '#1A1D2E', fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>
                                {formatAdminCount(isToday ? topIps.length : (overview?.avgDailyUv || 0))}
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* 工具使用洞察 */}
            <Card
                title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}><BarChartOutlined style={{ marginRight: 8, color: chartThemeColors.success }} />工具使用洞察</span>}
                bordered={false}
                style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={6}>
                        <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 4 }}>工具事件</div>
                        <div style={{ color: '#1A1D2E', fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
                            {formatAdminCount(toolEventStats?.totalEvents || 0)}
                        </div>
                    </Col>
                    <Col xs={24} md={6}>
                        <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 4 }}>失败事件</div>
                        <div style={{ color: toolEventStats?.failedEvents ? '#EF4444' : '#10B981', fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
                            {formatAdminCount(toolEventStats?.failedEvents || 0)}
                        </div>
                    </Col>
                    <Col xs={24} md={6}>
                        <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 4 }}>失败率</div>
                        <div style={{ color: toolEventStats?.failureRate ? '#EF4444' : '#10B981', fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
                            {toolEventStats?.failureRate || 0}%
                        </div>
                    </Col>
                    <Col xs={24} md={6}>
                        <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 4 }}>最常用功能</div>
                        <div style={{ color: '#1A1D2E', fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
                            {toolEventInsights.topEventLabel ? getToolEventLabel(toolEventInsights.topEventLabel) : '-'}
                        </div>
                        {toolEventInsights.topEventCount > 0 && (
                            <div style={{ color: '#9CA3BE', fontSize: 12, marginTop: 4 }}>
                                {formatAdminCount(toolEventInsights.topEventCount)} 次 · {toolEventInsights.topEventPercentage}%
                            </div>
                        )}
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
                    <Col xs={24} md={8}>
                        <div style={{
                            border: '1px solid #EEF0F6',
                            borderRadius: 8,
                            padding: 14,
                            background: '#FAFBFF',
                        }}>
                            <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 6 }}>大输入事件</div>
                            <div style={{ color: '#1A1D2E', fontSize: 22, fontWeight: 600 }}>
                                {toolEventInsights.largeInputPercentage}%
                            </div>
                            <div style={{ color: '#9CA3BE', fontSize: 12 }}>
                                {formatAdminCount(toolEventInsights.largeInputEvents)} 次 · 50KB 以上
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <div style={{
                            border: '1px solid #EEF0F6',
                            borderRadius: 8,
                            padding: 14,
                            background: '#FAFBFF',
                        }}>
                            <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 6 }}>慢操作事件</div>
                            <div style={{ color: toolEventInsights.slowPercentage >= 10 ? '#F59E0B' : '#1A1D2E', fontSize: 22, fontWeight: 600 }}>
                                {toolEventInsights.slowPercentage}%
                            </div>
                            <div style={{ color: '#9CA3BE', fontSize: 12 }}>
                                {formatAdminCount(toolEventInsights.slowEvents)} 次 · 2 秒以上
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <div style={{
                            border: '1px solid #EEF0F6',
                            borderRadius: 8,
                            padding: 14,
                            background: '#FAFBFF',
                            minHeight: 92,
                        }}>
                            <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 8 }}>
                                <WarningOutlined style={{ marginRight: 6, color: chartThemeColors.warning }} />
                                建议动作
                            </div>
                            <div style={{ color: '#1A1D2E', fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
                                {toolEventInsights.recommendation}
                            </div>
                        </div>
                    </Col>
                </Row>
                <div
                    data-tour="tool-event-weekly-report"
                    style={{
                        marginTop: 20,
                        border: '1px solid #E7EAF5',
                        borderRadius: 8,
                        padding: 16,
                        background: '#FFFFFF',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ color: '#1A1D2E', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                                PM 周报 · {toolEventWeeklyReport.periodLabel}
                            </div>
                            <div style={{ color: '#5A607F', fontSize: 13, lineHeight: 1.6 }}>
                                {toolEventWeeklyReport.headline}
                            </div>
                        </div>
                        <Tag color={toolEventWeeklyReport.isEmpty ? 'default' : 'blue'} style={{ marginInlineEnd: 0 }}>
                            {toolEventWeeklyReport.isEmpty ? '待观测' : '可复盘'}
                        </Tag>
                    </div>

                    <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
                        {toolEventWeeklyReport.metrics.map(metric => (
                            <Col key={metric.key} xs={24} sm={12} lg={6}>
                                <div
                                    data-tour={`tool-event-weekly-metric-${metric.key}`}
                                    style={{
                                        height: '100%',
                                        minHeight: 94,
                                        border: '1px solid #EEF0F6',
                                        borderRadius: 8,
                                        padding: 12,
                                        background: getWeeklyToneBackground(metric.tone),
                                    }}
                                >
                                    <div style={{ color: '#5A607F', fontSize: 12, marginBottom: 6 }}>{metric.label}</div>
                                    <div style={{
                                        color: getWeeklyToneColor(metric.tone),
                                        fontSize: 20,
                                        fontWeight: 600,
                                        lineHeight: 1.25,
                                        wordBreak: 'break-word',
                                    }}>
                                        {metric.value}
                                    </div>
                                    <div style={{ color: '#7A819D', fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>
                                        {metric.helper}
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginTop: 14 }}>
                        <Col xs={24} lg={12}>
                            <div style={{ color: '#1A1D2E', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                                重点关注
                            </div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {toolEventWeeklyReport.focusItems.map(item => (
                                    <div
                                        key={item.key}
                                        data-tour={`tool-event-weekly-focus-${item.key}`}
                                        style={{
                                            borderLeft: `3px solid ${getWeeklyToneColor(item.tone)}`,
                                            borderRadius: 6,
                                            background: getWeeklyToneBackground(item.tone),
                                            padding: '10px 12px',
                                        }}
                                    >
                                        <div style={{ color: '#1A1D2E', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                            {item.title}
                                        </div>
                                        <div style={{ color: '#5A607F', fontSize: 12, lineHeight: 1.5 }}>
                                            {item.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Col>
                        <Col xs={24} lg={12}>
                            <div style={{ color: '#1A1D2E', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                                下周动作
                            </div>
                            <div style={{
                                display: 'grid',
                                gap: 10,
                                border: '1px solid #EEF0F6',
                                borderRadius: 8,
                                padding: 12,
                                background: '#FAFBFF',
                            }}>
                                {toolEventWeeklyReport.actionItems.map((item, index) => (
                                    <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            background: 'rgba(91,110,245,0.12)',
                                            color: chartThemeColors.primary,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            flexShrink: 0,
                                            marginTop: 1,
                                        }}>
                                            {index + 1}
                                        </span>
                                        <span style={{ color: '#5A607F', fontSize: 12, lineHeight: 1.5 }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </div>
                <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
                    <Col xs={24} lg={8}>
                        <div style={{ color: '#1A1D2E', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>高频功能</div>
                        {renderToolEventList(toolEventStats?.topEvents || [], chartThemeColors.primary)}
                    </Col>
                    <Col xs={24} lg={8}>
                        <div style={{ color: '#1A1D2E', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>输入大小</div>
                        {renderToolEventList(toolEventStats?.inputSizeDistribution || [], chartThemeColors.info)}
                    </Col>
                    <Col xs={24} lg={8}>
                        <div style={{ color: '#1A1D2E', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>耗时分布</div>
                        {renderToolEventList(toolEventStats?.durationDistribution || [], chartThemeColors.warning)}
                    </Col>
                </Row>
            </Card>

            {/* 每日趋势图 - 仅在多天视图显示 */}
            {!isToday && (
                <Card
                    title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}>每日访问趋势</span>}
                    bordered={false}
                    style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                    <Suspense fallback={<ChartFallback height={260} />}>
                        <LazyColumn
                            data={trendChartData}
                            xField="date"
                            yField="value"
                            colorField="type"
                            group={true}
                            height={260}
                            columnWidthRatio={0.5}
                            scale={{ color: { range: [chartThemeColors.primary, chartThemeColors.success] } }}
                            style={{ radiusTopLeft: 4, radiusTopRight: 4 }}
                            axis={{
                                x: { title: false, line: { style: { stroke: '#E8EAF2' } }, tick: { style: { stroke: '#E8EAF2' } } },
                                y: { title: false, labelFormatter: formatAdminCount, grid: { line: { style: { stroke: '#F0F1F5', lineDash: [3, 3] } } } },
                            }}
                            legend={{ position: 'top-right', itemName: { style: { fill: '#5A607F' } } }}
                            tooltip={{
                                title: (d: { date: string }) => d.date,
                                items: [{ channel: 'y', valueFormatter: formatAdminCount }],
                            }}
                            interaction={{ elementHighlight: { background: true } }}
                        />
                    </Suspense>
                </Card>
            )}

            {/* 地区分布 - 只保留表格 */}
            <Card
                title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}><EnvironmentOutlined style={{ marginRight: 8, color: chartThemeColors.primary }} />访客地区分布</span>}
                bordered={false}
                style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <Table
                    columns={geoColumns}
                    dataSource={geoStats}
                    rowKey="region"
                    pagination={false}
                    size="small"
                />
            </Card>

            {/* IP和路径排行榜 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}><GlobalOutlined style={{ marginRight: 8, color: chartThemeColors.primary }} />IP访问排行</span>}
                        bordered={false}
                        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                        <Table
                            columns={ipColumns}
                            dataSource={topIps}
                            rowKey="ip"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12} style={{ marginTop: 16 }} className="lg:mt-0">
                    <Card
                        title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}><LinkOutlined style={{ marginRight: 8, color: chartThemeColors.secondary }} />路径访问排行</span>}
                        bordered={false}
                        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                        <Table
                            columns={pathColumns}
                            dataSource={topPaths}
                            rowKey="path"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>

            {/* 24小时访问分布 */}
            <Card
                title={
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}>
                        <ClockCircleOutlined style={{ marginRight: 8, color: chartThemeColors.info }} />
                        24小时访问分布
                        {isToday && (
                            <span style={{ fontWeight: 'normal', fontSize: 12, color: '#9CA3BE', marginLeft: 12 }}>
                                当前时段: {currentHour}:00 - {currentHour + 1}:00
                            </span>
                        )}
                    </span>
                }
                bordered={false}
                style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <Suspense fallback={<ChartFallback height={220} />}>
                    <LazyColumn
                        data={hourlyChartDataWithHighlight}
                        xField="hour"
                        yField="count"
                        height={220}
                        columnWidthRatio={0.5}
                        color={(datum: { isCurrent: boolean }) => datum.isCurrent ? chartThemeColors.primary : chartThemeColors.info}
                        style={{ radiusTopLeft: 4, radiusTopRight: 4 }}
                        axis={{
                            x: { title: false, labelAutoRotate: false, line: { style: { stroke: '#E8EAF2' } } },
                            y: { title: false, labelFormatter: formatAdminCount, grid: { line: { style: { stroke: '#F0F1F5', lineDash: [3, 3] } } } },
                        }}
                        tooltip={{
                            title: (d: { hour: string }) => `${d.hour} - ${parseInt(d.hour) + 1}:00`,
                            items: [{ channel: 'y', name: '访问量', valueFormatter: formatAdminCount }],
                        }}
                        interaction={{ elementHighlight: { background: true } }}
                    />
                </Suspense>
            </Card>

            {/* 设备和浏览器分布 - 使用进度条列表，数据少时更清晰 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <DistributionListCard
                        title={(
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}>
                                <LaptopOutlined style={{ marginRight: 8, color: chartThemeColors.primary }} />
                                设备类型分布
                            </span>
                        )}
                        items={deviceStats.map(item => ({
                            key: item.device || '未知',
                            label: item.device || '未知',
                            count: item.count,
                            percentage: item.percentage,
                        }))}
                        strokeColor={chartThemeColors.primary}
                        emptyText={failedSections.includes('deviceStats') ? '设备数据暂不可用' : '暂无设备数据'}
                    />
                </Col>
                <Col xs={24} lg={12} style={{ marginTop: 16 }} className="lg:mt-0">
                    <DistributionListCard
                        title={(
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}>
                                <ChromeOutlined style={{ marginRight: 8, color: chartThemeColors.secondary }} />
                                浏览器分布
                            </span>
                        )}
                        items={browserStats.map(item => ({
                            key: item.browser || '未知',
                            label: item.browser || '未知',
                            count: item.count,
                            percentage: item.percentage,
                        }))}
                        strokeColor={chartThemeColors.secondary}
                        emptyText={failedSections.includes('browserStats') ? '浏览器数据暂不可用' : '暂无浏览器数据'}
                    />
                </Col>
            </Row>

            {/* 来源统计和停留时长 - 使用进度条列表 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <DistributionListCard
                        title={(
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}>
                                <ShareAltOutlined style={{ marginRight: 8, color: chartThemeColors.info }} />
                                访问来源分布
                            </span>
                        )}
                        items={refererStats.map(item => ({
                            key: item.source,
                            label: item.source,
                            count: item.count,
                            percentage: item.percentage,
                        }))}
                        strokeColor={chartThemeColors.info}
                        emptyText={failedSections.includes('refererStats') ? '来源数据暂不可用' : '暂无来源数据'}
                    />
                </Col>
                <Col xs={24} lg={12} style={{ marginTop: 16 }} className="lg:mt-0">
                    <DistributionListCard
                        title={(
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}>
                                <FieldTimeOutlined style={{ marginRight: 8, color: chartThemeColors.warning }} />
                                停留时长分布
                            </span>
                        )}
                        items={sessionStats.map(item => ({
                            key: item.durationRange,
                            label: item.durationRange,
                            count: item.count,
                            percentage: item.percentage,
                        }))}
                        strokeColor={chartThemeColors.warning}
                        emptyText={failedSections.includes('sessionStats') ? '停留数据暂不可用' : '暂无停留数据'}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default TrafficStats;
