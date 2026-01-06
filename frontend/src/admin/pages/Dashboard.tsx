import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { UserOutlined, PayCircleOutlined, ThunderboltOutlined, EyeOutlined, TeamOutlined } from '@ant-design/icons';
import { getStatistics, Statistics } from '../services/stats';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getStatistics();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch statistics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }

    return (
        <div>
            <Row gutter={16}>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="总用户数"
                            value={stats?.totalUsers || 0}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#3f51b5' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="活跃订阅"
                            value={stats?.activeSubscriptions || 0}
                            prefix={<ThunderboltOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="总收入"
                            value={stats?.totalRevenue || 0}
                            prefix={<PayCircleOutlined />}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '24px' }}>
                <Col span={12}>
                    <Card title="流量统计 (今日)" bordered={false}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Statistic
                                    title="浏览量 (PV)"
                                    value={stats?.todayPv || 0}
                                    prefix={<EyeOutlined />}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="访客数 (UV)"
                                    value={stats?.todayUv || 0}
                                    prefix={<TeamOutlined />}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
