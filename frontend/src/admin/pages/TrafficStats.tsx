import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Spin, Table, Segmented, Progress, Tooltip } from 'antd';
import { 
    EyeOutlined, 
    TeamOutlined, 
    RiseOutlined,
    GlobalOutlined,
    LinkOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
    getTrafficOverview,
    getTrafficTrend,
    getTopIps,
    getTopPaths,
    getHourlyStats,
    getGeoDistribution,
    TrafficOverview,
    TrendItem,
    TopIpItem,
    TopPathItem,
    HourlyItem,
    GeoStatsItem,
} from '../services/traffic';

const TrafficStats: React.FC = () => {
    const [days, setDays] = useState<number>(7);
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<TrafficOverview | null>(null);
    const [trend, setTrend] = useState<TrendItem[]>([]);
    const [topIps, setTopIps] = useState<TopIpItem[]>([]);
    const [topPaths, setTopPaths] = useState<TopPathItem[]>([]);
    const [hourlyStats, setHourlyStats] = useState<HourlyItem[]>([]);
    const [geoStats, setGeoStats] = useState<GeoStatsItem[]>([]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewData, trendData, ipsData, pathsData, hourlyData, geoData] = await Promise.all([
                getTrafficOverview(days),
                getTrafficTrend(days),
                getTopIps(days, 10),
                getTopPaths(days, 10),
                getHourlyStats(days),
                getGeoDistribution(days, 15),
            ]);
            setOverview(overviewData);
            setTrend(trendData);
            setTopIps(ipsData);
            setTopPaths(pathsData);
            setHourlyStats(hourlyData);
            setGeoStats(geoData);
        } catch (error) {
            console.error('Failed to fetch traffic data:', error);
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        fetchAllData();
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

    // 计算趋势图的最大值
    const maxPv = Math.max(...trend.map(t => t.pv), 1);
    const maxUv = Math.max(...trend.map(t => t.uv), 1);
    const maxHourly = Math.max(...hourlyStats.map(h => h.count), 1);
    const maxGeoCount = Math.max(...geoStats.map(g => g.count), 1);

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
            {/* 时间范围切换 */}
            <div style={{ marginBottom: 24 }}>
                <Segmented
                    options={[
                        { label: '近7天', value: 7 },
                        { label: '近30天', value: 30 },
                    ]}
                    value={days}
                    onChange={(value) => setDays(value as number)}
                />
            </div>

            {/* 概览数据卡片 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card bordered={false} size="small">
                        <Statistic
                            title="总浏览量(PV)"
                            value={overview?.totalPv || 0}
                            prefix={<EyeOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card bordered={false} size="small">
                        <Statistic
                            title="总访客数(UV)"
                            value={overview?.totalUv || 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card bordered={false} size="small">
                        <Statistic
                            title="今日PV"
                            value={overview?.todayPv || 0}
                            prefix={<EyeOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card bordered={false} size="small">
                        <Statistic
                            title="今日UV"
                            value={overview?.todayUv || 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card bordered={false} size="small">
                        <Statistic
                            title="日均PV"
                            value={overview?.avgDailyPv || 0}
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Card bordered={false} size="small">
                        <Statistic
                            title="日均UV"
                            value={overview?.avgDailyUv || 0}
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                            precision={0}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 每日趋势图 */}
            <Card 
                title="每日访问趋势" 
                bordered={false} 
                style={{ marginTop: 16 }}
                extra={
                    <span>
                        <span style={{ marginRight: 16 }}><span style={{ color: '#1890ff' }}>●</span> PV</span>
                        <span><span style={{ color: '#52c41a' }}>●</span> UV</span>
                    </span>
                }
            >
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: trend.length * 80, display: 'flex', alignItems: 'flex-end', height: 200, gap: 8 }}>
                        {trend.map((item, index) => (
                            <div key={index} style={{ flex: 1, minWidth: 60, textAlign: 'center' }}>
                                <Tooltip title={`PV: ${item.pv.toLocaleString()} | UV: ${item.uv.toLocaleString()}`}>
                                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end', height: 160 }}>
                                        <div
                                            style={{
                                                width: 20,
                                                height: `${(item.pv / maxPv) * 100}%`,
                                                minHeight: 4,
                                                backgroundColor: '#1890ff',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 0.3s',
                                            }}
                                        />
                                        <div
                                            style={{
                                                width: 20,
                                                height: `${(item.uv / maxUv) * 100}%`,
                                                minHeight: 4,
                                                backgroundColor: '#52c41a',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 0.3s',
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                                <div style={{ fontSize: 12, color: '#666', marginTop: 8, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                                    {item.date.slice(5)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* 地区分布 */}
            <Card 
                title={<><EnvironmentOutlined style={{ marginRight: 8 }} />访客地区分布</>}
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
                        {/* 简单条形图 */}
                        <div style={{ padding: '0 16px' }}>
                            {geoStats.slice(0, 10).map((item, index) => (
                                <Tooltip key={item.region} title={`${item.region}: ${item.count.toLocaleString()}次 (${item.percentage}%)`}>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ 
                                                fontSize: 13,
                                                fontWeight: index < 3 ? 'bold' : 'normal',
                                                color: index === 0 ? '#f5222d' : index === 1 ? '#fa8c16' : index === 2 ? '#faad14' : 'inherit'
                                            }}>
                                                {item.region}
                                            </span>
                                            <span style={{ fontSize: 12, color: '#666' }}>
                                                {item.count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div 
                                            style={{ 
                                                height: 8, 
                                                backgroundColor: '#f0f0f0', 
                                                borderRadius: 4,
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div 
                                                style={{ 
                                                    width: `${(item.count / maxGeoCount) * 100}%`,
                                                    height: '100%',
                                                    backgroundColor: index === 0 ? '#f5222d' : index === 1 ? '#fa8c16' : index === 2 ? '#faad14' : '#1890ff',
                                                    borderRadius: 4,
                                                    transition: 'width 0.3s'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Tooltip>
                            ))}
                            {geoStats.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                                    暂无地区数据
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* IP和路径排行榜 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card 
                        title={<><GlobalOutlined style={{ marginRight: 8 }} />IP访问排行</>} 
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
                        title={<><LinkOutlined style={{ marginRight: 8 }} />路径访问排行</>} 
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

            {/* 24小时访问分布 */}
            <Card 
                title={<><ClockCircleOutlined style={{ marginRight: 8 }} />24小时访问分布</>}
                bordered={false} 
                style={{ marginTop: 16 }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 4 }}>
                    {Array.from({ length: 24 }, (_, hour) => {
                        const item = hourlyStats.find(h => h.hour === hour);
                        const count = item?.count || 0;
                        const percentage = (count / maxHourly) * 100;
                        return (
                            <Tooltip key={hour} title={`${hour}:00 - ${hour + 1}:00: ${count.toLocaleString()}次`}>
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div
                                        style={{
                                            height: `${Math.max(percentage, 4)}%`,
                                            minHeight: 4,
                                            backgroundColor: '#1890ff',
                                            borderRadius: '2px 2px 0 0',
                                            transition: 'height 0.3s',
                                            margin: '0 auto',
                                            width: '80%',
                                        }}
                                    />
                                    <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                                        {hour}
                                    </div>
                                </div>
                            </Tooltip>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default TrafficStats;