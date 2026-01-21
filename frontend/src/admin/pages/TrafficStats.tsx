import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Row, Col, Card, Statistic, Spin, Table, Segmented, Progress, Tooltip, Typography, Tag } from 'antd';
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
    FieldTimeOutlined
} from '@ant-design/icons';

const { Title } = Typography;
import { Column, Bar } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import {
    getTrafficOverview,
    getTrafficTrend,
    getTopIps,
    getTopPaths,
    getHourlyStats,
    getGeoDistribution,
    getDeviceDistribution,
    getBrowserDistribution,
    getRefererDistribution,
    getSessionDuration,
    TrafficOverview,
    TrendItem,
    TopIpItem,
    TopPathItem,
    HourlyItem,
    GeoStatsItem,
    DeviceStatsItem,
    RefererStatsItem,
    SessionStatsItem,
} from '../services/traffic';

const TrafficStats: React.FC = () => {
    const [days, setDays] = useState<number>(1); // 默认今日
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<TrafficOverview | null>(null);
    const [trend, setTrend] = useState<TrendItem[]>([]);
    const [topIps, setTopIps] = useState<TopIpItem[]>([]);
    const [topPaths, setTopPaths] = useState<TopPathItem[]>([]);
    const [hourlyStats, setHourlyStats] = useState<HourlyItem[]>([]);
    const [geoStats, setGeoStats] = useState<GeoStatsItem[]>([]);
    const [deviceStats, setDeviceStats] = useState<DeviceStatsItem[]>([]);
    const [browserStats, setBrowserStats] = useState<DeviceStatsItem[]>([]);
    const [refererStats, setRefererStats] = useState<RefererStatsItem[]>([]);
    const [sessionStats, setSessionStats] = useState<SessionStatsItem[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const isToday = days === 1;

    // 颜色主题 - 专业低调配色
    const chartColors = {
        primary: '#4a7c9b',      // 沉稳的蓝灰色
        secondary: '#6b9b7a',    // 淡绿灰
        accent: '#e8a87c',       // 暖橙色，用于高亮
        muted: '#8b9dc3',        // 柔和蓝紫
        text: '#5a6c7d',         // 文字灰
        border: '#e8eef3',       // 边框色
    };

    // 统计卡片装饰色
    const statCardColors = {
        pv: '#4a7c9b',
        uv: '#6b9b7a', 
        avg: '#8b9dc3',
        ip: '#e8a87c',
    };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewData, trendData, ipsData, pathsData, hourlyData, geoData, deviceData, browserData, refererData, sessionData] = await Promise.all([
                getTrafficOverview(days),
                getTrafficTrend(days),
                getTopIps(days, 10),
                getTopPaths(days, 10),
                getHourlyStats(days),
                getGeoDistribution(days, 15),
                getDeviceDistribution(days, 10),
                getBrowserDistribution(days, 10),
                getRefererDistribution(days, 10),
                getSessionDuration(days),
            ]);
            setOverview(overviewData);
            setTrend(trendData);
            setTopIps(ipsData);
            setTopPaths(pathsData);
            setHourlyStats(hourlyData);
            setGeoStats(geoData);
            setDeviceStats(deviceData);
            setBrowserStats(browserData);
            setRefererStats(refererData);
            setSessionStats(sessionData);
        } catch (error) {
            console.error('Failed to fetch traffic data:', error);
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        fetchAllData();
        // 今日模式：每5分钟自动刷新
        if (isToday) {
            intervalRef.current = setInterval(fetchAllData, 5 * 60 * 1000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchAllData, isToday]);

    // IP排行表格列配置
    const ipColumns: ColumnsType<TopIpItem> = [
        {
            title: '排名',
            key: 'rank',
            width: 60,
            render: (_, __, index) => (
                <span style={{
                    fontWeight: index < 3 ? 'bold' : 'normal',
                    color: index === 0 ? '#f5222d' : index === 1 ? '#fa8c16' : index === 2 ? '#faad14' : 'inherit'
                }}>
                    {index + 1}
                </span>
            ),
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
                    <EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
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
            render: (count: number) => count.toLocaleString(),
        },
    ];

    // 路径排行表格列配置
    const pathColumns: ColumnsType<TopPathItem> = [
        {
            title: '排名',
            key: 'rank',
            width: 60,
            render: (_, __, index) => (
                <span style={{ 
                    fontWeight: index < 3 ? 'bold' : 'normal',
                    color: index === 0 ? '#f5222d' : index === 1 ? '#fa8c16' : index === 2 ? '#faad14' : 'inherit'
                }}>
                    {index + 1}
                </span>
            ),
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
            render: (count: number) => count.toLocaleString(),
        },
    ];

    // 计算地区分布最大值（用于 Progress 百分比）
    const maxGeoCount = useMemo(() => Math.max(...geoStats.map(g => g.count), 1), [geoStats]);

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

    // 地区分布条形图数据（取前10）
    const geoBarData = useMemo(() => geoStats.slice(0, 10).map(item => ({
        region: item.region,
        count: item.count,
    })).reverse(), [geoStats]); // 反转让最高的在上面

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
            render: (_, __, index) => (
                <span style={{ 
                    fontWeight: index < 3 ? 'bold' : 'normal',
                    color: index === 0 ? '#f5222d' : index === 1 ? '#fa8c16' : index === 2 ? '#faad14' : 'inherit'
                }}>
                    {index + 1}
                </span>
            ),
        },
        {
            title: '地区',
            dataIndex: 'region',
            key: 'region',
            render: (region: string) => (
                <span>
                    <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
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
            render: (count: number) => count.toLocaleString(),
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
                        strokeColor="#1890ff"
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
                        <BarChartOutlined />
                        流量统计
                    </Title>
                    {isToday && (
                        <>
                            <span style={{ color: '#666', fontSize: 14 }}>{todayStr}</span>
                            <Tag color="blue">实时 · 5分钟刷新</Tag>
                        </>
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

            {/* 概览数据卡片 - 简洁专业设计 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: 6,
                            borderLeft: `3px solid ${statCardColors.pv}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Statistic
                            title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>{isToday ? '今日浏览量 (PV)' : `${days}天总浏览量`}</span>}
                            value={isToday ? (overview?.todayPv || 0) : (overview?.totalPv || 0)}
                            prefix={<EyeOutlined style={{ color: statCardColors.pv, marginRight: 4 }} />}
                            valueStyle={{ color: '#2c3e50', fontSize: 26, fontWeight: 500 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: 6,
                            borderLeft: `3px solid ${statCardColors.uv}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Statistic
                            title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>{isToday ? '今日访客数 (UV)' : `${days}天总访客数`}</span>}
                            value={isToday ? (overview?.todayUv || 0) : (overview?.totalUv || 0)}
                            prefix={<TeamOutlined style={{ color: statCardColors.uv, marginRight: 4 }} />}
                            valueStyle={{ color: '#2c3e50', fontSize: 26, fontWeight: 500 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: 6,
                            borderLeft: `3px solid ${statCardColors.avg}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Statistic
                            title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>{isToday ? '人均浏览页数' : '日均PV'}</span>}
                            value={isToday
                                ? (overview?.todayUv ? (overview.todayPv / overview.todayUv).toFixed(1) : 0)
                                : (overview?.avgDailyPv || 0)
                            }
                            prefix={<RiseOutlined style={{ color: statCardColors.avg, marginRight: 4 }} />}
                            valueStyle={{ color: '#2c3e50', fontSize: 26, fontWeight: 500 }}
                            suffix={isToday ? <span style={{ color: '#8c8c8c', fontSize: 14 }}>页</span> : undefined}
                            precision={isToday ? undefined : 0}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: 6,
                            borderLeft: `3px solid ${statCardColors.ip}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Statistic
                            title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>{isToday ? '独立IP数' : '日均UV'}</span>}
                            value={isToday ? topIps.length : (overview?.avgDailyUv || 0)}
                            prefix={<GlobalOutlined style={{ color: statCardColors.ip, marginRight: 4 }} />}
                            valueStyle={{ color: '#2c3e50', fontSize: 26, fontWeight: 500 }}
                            precision={isToday ? undefined : 0}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 每日趋势图 - 仅在多天视图显示 */}
            {!isToday && (
                <Card
                    title={<span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}>每日访问趋势</span>}
                    bordered={false}
                    style={{ marginTop: 16, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                    <Column
                        data={trendChartData}
                        xField="date"
                        yField="value"
                        colorField="type"
                        group={true}
                        height={260}
                        columnWidthRatio={0.5}
                        scale={{ color: { range: [chartColors.primary, chartColors.secondary] } }}
                        axis={{
                            x: { title: false, line: { style: { stroke: '#e8eef3' } }, tick: { style: { stroke: '#e8eef3' } } },
                            y: { title: false, labelFormatter: (v: number) => v.toLocaleString(), grid: { line: { style: { stroke: '#f0f0f0', lineDash: [3, 3] } } } },
                        }}
                        legend={{ position: 'top-right', itemName: { style: { fill: '#666' } } }}
                        tooltip={{
                            title: (d: { date: string }) => d.date,
                            items: [{ channel: 'y', valueFormatter: (v: number) => v.toLocaleString() }],
                        }}
                        interaction={{ elementHighlight: { background: true } }}
                    />
                </Card>
            )}

            {/* 地区分布 - 只保留表格 */}
            <Card
                title={<span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}><EnvironmentOutlined style={{ marginRight: 8, color: chartColors.primary }} />访客地区分布</span>}
                bordered={false}
                style={{ marginTop: 16, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
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
                        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}><GlobalOutlined style={{ marginRight: 8, color: chartColors.primary }} />IP访问排行</span>}
                        bordered={false}
                        style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
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
                        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}><LinkOutlined style={{ marginRight: 8, color: chartColors.secondary }} />路径访问排行</span>}
                        bordered={false}
                        style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
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
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}>
                        <ClockCircleOutlined style={{ marginRight: 8, color: chartColors.muted }} />
                        24小时访问分布
                        {isToday && (
                            <span style={{ fontWeight: 'normal', fontSize: 12, color: '#999', marginLeft: 12 }}>
                                当前时段: {currentHour}:00 - {currentHour + 1}:00
                            </span>
                        )}
                    </span>
                }
                bordered={false}
                style={{ marginTop: 16, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
                <Column
                    data={hourlyChartDataWithHighlight}
                    xField="hour"
                    yField="count"
                    height={220}
                    columnWidthRatio={0.5}
                    color={(datum: { isCurrent: boolean }) => datum.isCurrent ? chartColors.accent : chartColors.muted}
                    axis={{
                        x: { title: false, labelAutoRotate: false, line: { style: { stroke: '#e8eef3' } } },
                        y: { title: false, labelFormatter: (v: number) => v.toLocaleString(), grid: { line: { style: { stroke: '#f0f0f0', lineDash: [3, 3] } } } },
                    }}
                    tooltip={{
                        title: (d: { hour: string }) => `${d.hour} - ${parseInt(d.hour) + 1}:00`,
                        items: [{ channel: 'y', name: '访问量', valueFormatter: (v: number) => v.toLocaleString() }],
                    }}
                    interaction={{ elementHighlight: { background: true } }}
                />
            </Card>

            {/* 设备和浏览器分布 - 使用进度条列表，数据少时更清晰 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}><LaptopOutlined style={{ marginRight: 8, color: chartColors.primary }} />设备类型分布</span>}
                        bordered={false}
                        style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    >
                        {deviceStats.length > 0 ? (
                            <div style={{ padding: '8px 0' }}>
                                {deviceStats.map((item, index) => (
                                    <div key={item.device} style={{ marginBottom: index < deviceStats.length - 1 ? 16 : 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ color: '#2c3e50', fontSize: 13 }}>{item.device || '未知'}</span>
                                            <span style={{ color: '#8c8c8c', fontSize: 13 }}>{item.count.toLocaleString()} ({item.percentage}%)</span>
                                        </div>
                                        <Progress 
                                            percent={item.percentage} 
                                            showInfo={false}
                                            strokeColor={chartColors.primary}
                                            trailColor="#f0f0f0"
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无设备数据
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={12} style={{ marginTop: 16 }} className="lg:mt-0">
                    <Card
                        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}><ChromeOutlined style={{ marginRight: 8, color: chartColors.secondary }} />浏览器分布</span>}
                        bordered={false}
                        style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    >
                        {browserStats.length > 0 ? (
                            <div style={{ padding: '8px 0' }}>
                                {browserStats.map((item, index) => (
                                    <div key={item.browser} style={{ marginBottom: index < browserStats.length - 1 ? 16 : 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ color: '#2c3e50', fontSize: 13 }}>{item.browser || '未知'}</span>
                                            <span style={{ color: '#8c8c8c', fontSize: 13 }}>{item.count.toLocaleString()} ({item.percentage}%)</span>
                                        </div>
                                        <Progress 
                                            percent={item.percentage} 
                                            showInfo={false}
                                            strokeColor={chartColors.secondary}
                                            trailColor="#f0f0f0"
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无浏览器数据
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* 来源统计和停留时长 - 使用进度条列表 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}><ShareAltOutlined style={{ marginRight: 8, color: chartColors.muted }} />访问来源分布</span>}
                        bordered={false}
                        style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    >
                        {refererStats.length > 0 ? (
                            <div style={{ padding: '8px 0' }}>
                                {refererStats.map((item, index) => (
                                    <div key={item.source} style={{ marginBottom: index < refererStats.length - 1 ? 16 : 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ color: '#2c3e50', fontSize: 13 }}>{item.source}</span>
                                            <span style={{ color: '#8c8c8c', fontSize: 13 }}>{item.count.toLocaleString()} ({item.percentage}%)</span>
                                        </div>
                                        <Progress 
                                            percent={item.percentage} 
                                            showInfo={false}
                                            strokeColor={chartColors.muted}
                                            trailColor="#f0f0f0"
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无来源数据
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={12} style={{ marginTop: 16 }} className="lg:mt-0">
                    <Card
                        title={<span style={{ fontSize: 15, fontWeight: 500, color: '#2c3e50' }}><FieldTimeOutlined style={{ marginRight: 8, color: chartColors.accent }} />停留时长分布</span>}
                        bordered={false}
                        style={{ borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    >
                        {sessionStats.length > 0 ? (
                            <div style={{ padding: '8px 0' }}>
                                {sessionStats.map((item, index) => (
                                    <div key={item.durationRange} style={{ marginBottom: index < sessionStats.length - 1 ? 16 : 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ color: '#2c3e50', fontSize: 13 }}>{item.durationRange}</span>
                                            <span style={{ color: '#8c8c8c', fontSize: 13 }}>{item.count.toLocaleString()} ({item.percentage}%)</span>
                                        </div>
                                        <Progress 
                                            percent={item.percentage} 
                                            showInfo={false}
                                            strokeColor={chartColors.accent}
                                            trailColor="#f0f0f0"
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无停留数据
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default TrafficStats;