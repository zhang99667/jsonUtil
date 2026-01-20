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

    // 颜色主题
    const chartColors = {
        primary: '#1890ff',
        success: '#52c41a',
        warning: '#faad14',
        error: '#f5222d',
        purple: '#722ed1',
        orange: '#fa8c16',
        cyan: '#13c2c2',
        gradient: ['#1890ff', '#36cfc9', '#73d13d', '#ffec3d', '#ff9c6e', '#ff7a45'],
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

            {/* 概览数据卡片 - 根据时间范围显示不同指标 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 8 }}>
                        <Statistic
                            title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>{isToday ? '今日浏览量 (PV)' : `${days}天总浏览量`}</span>}
                            value={isToday ? (overview?.todayPv || 0) : (overview?.totalPv || 0)}
                            prefix={<EyeOutlined />}
                            valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: 8 }}>
                        <Statistic
                            title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>{isToday ? '今日访客数 (UV)' : `${days}天总访客数`}</span>}
                            value={isToday ? (overview?.todayUv || 0) : (overview?.totalUv || 0)}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: 8 }}>
                        <Statistic
                            title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>{isToday ? '人均浏览页数' : '日均PV'}</span>}
                            value={isToday
                                ? (overview?.todayUv ? (overview.todayPv / overview.todayUv).toFixed(1) : 0)
                                : (overview?.avgDailyPv || 0)
                            }
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 600 }}
                            suffix={isToday ? <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>页</span> : undefined}
                            precision={isToday ? undefined : 0}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderRadius: 8 }}>
                        <Statistic
                            title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>{isToday ? '独立IP数' : '日均UV'}</span>}
                            value={isToday ? topIps.length : (overview?.avgDailyUv || 0)}
                            prefix={<GlobalOutlined />}
                            valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 600 }}
                            precision={isToday ? undefined : 0}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 每日趋势图 */}
            <Card
                title={<span style={{ fontSize: 16, fontWeight: 600 }}>每日访问趋势</span>}
                bordered={false}
                style={{ marginTop: 16, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
            >
                <Column
                    data={trendChartData}
                    xField="date"
                    yField="value"
                    colorField="type"
                    group={true}
                    height={280}
                    columnWidthRatio={0.6}
                    scale={{ color: { range: [chartColors.primary, chartColors.success] } }}
                    axis={{
                        x: { title: false },
                        y: { title: false, labelFormatter: (v: number) => v.toLocaleString() },
                    }}
                    legend={{ position: 'top-right' }}
                    tooltip={{
                        title: (d: { date: string }) => d.date,
                        items: [{ channel: 'y', valueFormatter: (v: number) => v.toLocaleString() }],
                    }}
                    interaction={{ elementHighlight: { background: true } }}
                />
            </Card>

            {/* 地区分布 */}
            <Card
                title={<span style={{ fontSize: 16, fontWeight: 600 }}><EnvironmentOutlined style={{ marginRight: 8 }} />访客地区分布</span>}
                bordered={false}
                style={{ marginTop: 16, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
            >
                <Row gutter={24}>
                    <Col xs={24} lg={12}>
                        <Table
                            columns={geoColumns}
                            dataSource={geoStats}
                            rowKey="region"
                            pagination={false}
                            size="small"
                        />
                    </Col>
                    <Col xs={24} lg={12}>
                        {geoBarData.length > 0 ? (
                            <Bar
                                data={geoBarData}
                                xField="count"
                                yField="region"
                                height={geoBarData.length * 36}
                                colorField="region"
                                legend={false}
                                axis={{
                                    x: { title: false, labelFormatter: (v: number) => v.toLocaleString() },
                                    y: { title: false },
                                }}
                                label={{
                                    text: (d: { count: number }) => d.count.toLocaleString(),
                                    position: 'right',
                                    style: { fill: '#666', fontSize: 12 },
                                }}
                                tooltip={{
                                    title: (d: { region: string }) => d.region,
                                    items: [{ channel: 'x', name: '访问量', valueFormatter: (v: number) => v.toLocaleString() }],
                                }}
                                style={{
                                    maxHeight: 400,
                                }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无地区数据
                            </div>
                        )}
                    </Col>
                </Row>
            </Card>

            {/* IP和路径排行榜 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontSize: 16, fontWeight: 600 }}><GlobalOutlined style={{ marginRight: 8 }} />IP访问排行</span>}
                        bordered={false}
                        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
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
                        title={<span style={{ fontSize: 16, fontWeight: 600 }}><LinkOutlined style={{ marginRight: 8 }} />路径访问排行</span>}
                        bordered={false}
                        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
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
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        24小时访问分布
                        {isToday && (
                            <span style={{ fontWeight: 'normal', fontSize: 12, color: '#999', marginLeft: 12 }}>
                                当前时段: {currentHour}:00 - {currentHour + 1}:00
                            </span>
                        )}
                    </span>
                }
                bordered={false}
                style={{ marginTop: 16, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
            >
                <Column
                    data={hourlyChartDataWithHighlight}
                    xField="hour"
                    yField="count"
                    height={220}
                    columnWidthRatio={0.5}
                    color={(datum: { isCurrent: boolean }) => datum.isCurrent ? chartColors.error : chartColors.primary}
                    axis={{
                        x: { title: false, labelAutoRotate: false },
                        y: { title: false, labelFormatter: (v: number) => v.toLocaleString() },
                    }}
                    tooltip={{
                        title: (d: { hour: string }) => `${d.hour} - ${parseInt(d.hour) + 1}:00`,
                        items: [{ channel: 'y', name: '访问量', valueFormatter: (v: number) => v.toLocaleString() }],
                    }}
                    interaction={{ elementHighlight: { background: true } }}
                />
            </Card>

            {/* 设备和浏览器分布 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontSize: 16, fontWeight: 600 }}><LaptopOutlined style={{ marginRight: 8 }} />设备类型分布</span>}
                        bordered={false}
                        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
                    >
                        {deviceStats.length > 0 ? (
                            <Bar
                                data={[...deviceStats].reverse()}
                                xField="count"
                                yField="device"
                                height={Math.max(deviceStats.length * 50, 180)}
                                colorField="device"
                                legend={false}
                                axis={{
                                    x: { title: false, labelFormatter: (v: number) => v.toLocaleString() },
                                    y: { title: false },
                                }}
                                label={{
                                    text: (d: DeviceStatsItem) => `${d.count.toLocaleString()} (${d.percentage}%)`,
                                    position: 'right',
                                    style: { fill: '#666', fontSize: 12 },
                                }}
                                tooltip={{
                                    title: (d: DeviceStatsItem) => d.device || '未知',
                                    items: [{ channel: 'x', name: '访问量', valueFormatter: (v: number) => v.toLocaleString() }],
                                }}
                                interaction={{ elementHighlight: { background: true } }}
                                style={{
                                    maxHeight: 300,
                                }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无设备数据
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={12} style={{ marginTop: 16 }} className="lg:mt-0">
                    <Card
                        title={<span style={{ fontSize: 16, fontWeight: 600 }}><ChromeOutlined style={{ marginRight: 8 }} />浏览器分布</span>}
                        bordered={false}
                        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
                    >
                        {browserStats.length > 0 ? (
                            <Bar
                                data={[...browserStats].reverse()}
                                xField="count"
                                yField="browser"
                                height={Math.max(browserStats.length * 50, 180)}
                                colorField="browser"
                                legend={false}
                                axis={{
                                    x: { title: false, labelFormatter: (v: number) => v.toLocaleString() },
                                    y: { title: false },
                                }}
                                label={{
                                    text: (d: DeviceStatsItem) => `${d.count.toLocaleString()} (${d.percentage}%)`,
                                    position: 'right',
                                    style: { fill: '#666', fontSize: 12 },
                                }}
                                tooltip={{
                                    title: (d: DeviceStatsItem) => d.browser || '未知',
                                    items: [{ channel: 'x', name: '访问量', valueFormatter: (v: number) => v.toLocaleString() }],
                                }}
                                interaction={{ elementHighlight: { background: true } }}
                                style={{
                                    maxHeight: 300,
                                }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无浏览器数据
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* 来源统计和停留时长 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontSize: 16, fontWeight: 600 }}><ShareAltOutlined style={{ marginRight: 8 }} />访问来源分布</span>}
                        bordered={false}
                        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
                    >
                        {refererStats.length > 0 ? (
                            <Column
                                data={refererStats}
                                xField="source"
                                yField="count"
                                height={260}
                                columnWidthRatio={0.6}
                                colorField="source"
                                legend={false}
                                axis={{
                                    x: { title: false },
                                    y: { title: false, labelFormatter: (v: number) => v.toLocaleString() },
                                }}
                                label={{
                                    text: (d: RefererStatsItem) => `${d.percentage}%`,
                                    position: 'top',
                                    style: { fill: '#666', fontSize: 12 },
                                }}
                                tooltip={{
                                    title: (d: RefererStatsItem) => d.source,
                                    items: [
                                        { channel: 'y', name: '访问量', valueFormatter: (v: number) => v.toLocaleString() },
                                        { name: '占比', value: (d: RefererStatsItem) => `${d.percentage}%` }
                                    ],
                                }}
                                interaction={{ elementHighlight: { background: true } }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无来源数据
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={12} style={{ marginTop: 16 }} className="lg:mt-0">
                    <Card
                        title={<span style={{ fontSize: 16, fontWeight: 600 }}><FieldTimeOutlined style={{ marginRight: 8 }} />停留时长分布</span>}
                        bordered={false}
                        style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)' }}
                    >
                        {sessionStats.length > 0 ? (
                            <Column
                                data={sessionStats}
                                xField="durationRange"
                                yField="count"
                                height={260}
                                columnWidthRatio={0.6}
                                colorField="durationRange"
                                legend={false}
                                axis={{
                                    x: { title: false },
                                    y: { title: false, labelFormatter: (v: number) => v.toLocaleString() },
                                }}
                                label={{
                                    text: (d: SessionStatsItem) => `${d.percentage}%`,
                                    position: 'top',
                                    style: { fill: '#666', fontSize: 12 },
                                }}
                                tooltip={{
                                    title: (d: SessionStatsItem) => d.durationRange,
                                    items: [
                                        { channel: 'y', name: '会话数', valueFormatter: (v: number) => v.toLocaleString() },
                                        { name: '占比', value: (d: SessionStatsItem) => `${d.percentage}%` }
                                    ],
                                }}
                                interaction={{ elementHighlight: { background: true } }}
                            />
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