import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography } from 'antd';
import { UserOutlined, PayCircleOutlined, ThunderboltOutlined, EyeOutlined, TeamOutlined, DashboardOutlined } from '@ant-design/icons';
import { getStatistics, Statistics } from '../services/stats';

const { Title } = Typography;

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
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            {/* 页面标题 */}
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DashboardOutlined />
                    系统概览
                </Title>
            </div>

            {/* 核心指标 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="总用户数"
                            value={stats?.totalUsers || 0}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff', fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="活跃订阅"
                            value={stats?.activeSubscriptions || 0}
                            prefix={<ThunderboltOutlined />}
                            valueStyle={{ color: '#f5222d', fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="总收入"
                            value={stats?.totalRevenue || 0}
                            prefix={<PayCircleOutlined />}
                            precision={2}
                            valueStyle={{ color: '#52c41a', fontSize: 28 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 今日流量 */}
            <Card 
                title={<><EyeOutlined style={{ marginRight: 8 }} />今日流量</>}
                bordered={false} 
                style={{ marginTop: 16 }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                        <Card bordered={false} style={{ background: '#f0f5ff' }}>
                            <Statistic
                                title="浏览量 (PV)"
                                value={stats?.todayPv || 0}
                                prefix={<EyeOutlined />}
                                valueStyle={{ color: '#1890ff', fontSize: 28 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Card bordered={false} style={{ background: '#f6ffed' }}>
                            <Statistic
                                title="访客数 (UV)"
                                value={stats?.todayUv || 0}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: '#52c41a', fontSize: 28 }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default Dashboard;
