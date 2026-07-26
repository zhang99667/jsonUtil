import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Row, Col, Card as AntCard, Spin, Table, Segmented, Progress, Tooltip, Typography, Tag, theme } from 'antd';
import {
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
import { DistributionListCard } from '../components/DistributionListCard';
import { ToolEventInsightsCard } from '../components/ToolEventInsightsCard';
import { TrafficOverviewCards } from '../components/TrafficOverviewCards';
import { useTrafficStatsData } from '../hooks/useTrafficStatsData';
import type {
    TopIpItem,
    TopPathItem,
    GeoStatsItem,
} from '../services/traffic';
import { formatAdminCount } from '../utils/toolEventInsights';
import { chartThemeColors, gradients } from '../styles/theme';

const Card = AntCard as React.ComponentType<React.PropsWithChildren<CardProps>>;
const RANK_BADGE_GRADIENTS = [gradients.blue, gradients.violet, gradients.emerald] as const;

const LazyColumn = lazy(async () => {
    const { Column } = await import('@ant-design/charts');
    return { default: Column as React.ComponentType<Record<string, unknown>> };
});

// 图表库按需加载时保留局部占位，避免页面切换期间整页闪空。
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
    const [days, setDays] = useState<number>(1);
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

    const trendChartData = useMemo(() => trend.flatMap(item => [
        { date: item.date.slice(5), type: 'PV', value: item.pv },
        { date: item.date.slice(5), type: 'UV', value: item.uv },
    ]), [trend]);

    const hourlyChartData = useMemo(() => Array.from({ length: 24 }, (_, hour) => {
        const item = hourlyStats.find(h => h.hour === hour);
        return { hour: `${hour}:00`, count: item?.count || 0 };
    }), [hourlyStats]);

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

            <TrafficOverviewCards days={days} overview={overview} />

            <ToolEventInsightsCard days={days} stats={toolEventStats} />

            {!isToday && (
                <Card
                    title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}>每日访问趋势</span>}
                    variant="borderless"
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

            <Card
                title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}><EnvironmentOutlined style={{ marginRight: 8, color: chartThemeColors.primary }} />访客地区分布</span>}
                variant="borderless"
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

            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}><GlobalOutlined style={{ marginRight: 8, color: chartThemeColors.primary }} />IP访问排行</span>}
                        variant="borderless"
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
                        variant="borderless"
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
                variant="borderless"
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
