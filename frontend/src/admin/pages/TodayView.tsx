import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Spin, Table, Progress, Tooltip, Tag } from 'antd';
import { 
    EyeOutlined, 
    TeamOutlined, 
    GlobalOutlined,
    LinkOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    RiseOutlined,
    FallOutlined
} from '@ant-design/icons';
import { Column, Bar } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import {
    getTrafficOverview,
    getTopIps,
    getTopPaths,
    getHourlyStats,
    getGeoDistribution,
    TrafficOverview,
    TopIpItem,
    TopPathItem,
    HourlyItem,
    GeoStatsItem,
} from '../services/traffic';

const TodayView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<TrafficOverview | null>(null);
    const [topIps, setTopIps] = useState<TopIpItem[]>([]);
    const [topPaths, setTopPaths] = useState<TopPathItem[]>([]);
    const [hourlyStats, setHourlyStats] = useState<HourlyItem[]>([]);
    const [geoStats, setGeoStats] = useState<GeoStatsItem[]>([]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            // 获取今日数据 (days=1)
            const [overviewData, ipsData, pathsData, hourlyData, geoData] = await Promise.all([
                getTrafficOverview(1),
                getTopIps(1, 10),
                getTopPaths(1, 10),
                getHourlyStats(1),
                getGeoDistribution(1, 10),
            ]);
            setOverview(overviewData);
            setTopIps(ipsData);
            setTopPaths(pathsData);
            setHourlyStats(hourlyData);
            setGeoStats(geoData);
        } catch (error) {
            console.error('Failed to fetch today data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
        // 每5分钟自动刷新
        const interval = setInterval(fetchAllData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchAllData]);

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

    // 计算地区分布最大值
    const maxGeoCount = Math.max(...geoStats.map(g => g.count), 1);

    // 24小时分布数据
    const currentHour = new Date().getHours();
    const hourlyChartData = Array.from({ length: 24 }, (_, hour) => {
        const item = hourlyStats.find(h => h.hour === hour);
        return { 
            hour: `${hour}:00`, 
            count: item?.count || 0,
            isCurrent: hour === currentHour
        };
    });

    // 地区分布条形图数据
    const geoBarData = geoStats.slice(0, 8).map(item => ({
        region: item.region,
        count: item.count,
    })).reverse();

    // 地区分布表格列配置
    const geoColumns: ColumnsType<GeoStatsItem> = [
        {
            title: '排名',
            key: 'rank',
            width: 50,
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
                    <EnvironmentOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                    {region}
                </span>
            ),
        },
        {
            title: '访问量',
            dataIndex: 'count',
            key: 'count',
            width: 80,
            align: 'right',
            render: (count: number) => count.toLocaleString(),
        },
        {
            title: '占比',
            dataIndex: 'percentage',
            key: 'percentage',
            width: 140,
            render: (percentage: number, record: GeoStatsItem) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Progress 
                        percent={Math.round((record.count / maxGeoCount) * 100)} 
                        size="small" 
                        showInfo={false}
                        strokeColor="#1890ff"
                        style={{ flex: 1, minWidth: 50 }}
                    />
                    <span style={{ minWidth: 40, textAlign: 'right' }}>{percentage}%</span>
                </div>
            ),
        },
    ];

    // 获取当前时间的格式化字符串
    const todayStr = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            {/* 今日标题 */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <span style={{ fontSize: 18, fontWeight: 500 }}>{todayStr}</span>
                <Tag color="blue" style={{ marginLeft: 8 }}>实时数据 · 每5分钟更新</Tag>
            </div>

            {/* 今日核心数据 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="今日浏览量 (PV)"
                            value={overview?.todayPv || 0}
                            prefix={<EyeOutlined />}
                            valueStyle={{ color: '#1890ff', fontSize: 32 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="今日访客数 (UV)"
                            value={overview?.todayUv || 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#52c41a', fontSize: 32 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="人均访问页数"
                            value={overview?.todayUv ? (overview.todayPv / overview.todayUv).toFixed(1) : 0}
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#722ed1', fontSize: 32 }}
                            suffix="页"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="独立IP数"
                            value={topIps.length}
                            prefix={<GlobalOutlined />}
                            valueStyle={{ color: '#fa8c16', fontSize: 32 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 今日24小时分布 - 重点展示 */}
            <Card 
                title={
                    <span>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        今日访问时段分布
                        <span style={{ fontWeight: 'normal', fontSize: 12, color: '#999', marginLeft: 12 }}>
                            当前时段: {currentHour}:00 - {currentHour + 1}:00
                        </span>
                    </span>
                }
                bordered={false} 
                style={{ marginTop: 16 }}
            >
                <Column
                    data={hourlyChartData}
                    xField="hour"
                    yField="count"
                    height={220}
                    style={{ maxWidth: 28, minWidth: 10 }}
                    color={(datum: { isCurrent: boolean }) => datum.isCurrent ? '#f5222d' : '#1890ff'}
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

            {/* 今日地区分布 */}
            <Card 
                title={<><EnvironmentOutlined style={{ marginRight: 8 }} />今日访客地区</>}
                bordered={false} 
                style={{ marginTop: 16 }}
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
                                height={260}
                                colorField="region"
                                legend={false}
                                style={{ maxWidth: 32 }}
                                axis={{
                                    x: { title: false, labelFormatter: (v: number) => v.toLocaleString() },
                                    y: { title: false },
                                }}
                                label={{
                                    text: (d: { count: number }) => d.count.toLocaleString(),
                                    position: 'right',
                                    style: { fill: '#666' },
                                }}
                                tooltip={{
                                    title: (d: { region: string }) => d.region,
                                    items: [{ channel: 'x', name: '访问量', valueFormatter: (v: number) => v.toLocaleString() }],
                                }}
                                interaction={{ elementHighlight: { background: true } }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                暂无地区数据
                            </div>
                        )}
                    </Col>
                </Row>
            </Card>

            {/* 今日IP和路径排行 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card 
                        title={<><GlobalOutlined style={{ marginRight: 8 }} />今日IP访问排行</>} 
                        bordered={false}
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
                <Col xs={24} lg={12}>
                    <Card 
                        title={<><LinkOutlined style={{ marginRight: 8 }} />今日路径访问排行</>} 
                        bordered={false}
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
        </div>
    );
};

export default TodayView;