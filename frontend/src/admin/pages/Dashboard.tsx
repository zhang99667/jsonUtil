import React, { useEffect, useState } from 'react';
import { Row, Col, Statistic, Spin, Typography } from 'antd';
import { UserOutlined, PayCircleOutlined, ThunderboltOutlined, EyeOutlined, TeamOutlined, DashboardOutlined } from '@ant-design/icons';
import { getStatistics, Statistics } from '../services/stats';

const { Title } = Typography;

/** 英雄卡片通用样式 */
const heroCardBase: React.CSSProperties = {
    borderRadius: 16,
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
    color: '#fff',
};

/** 英雄卡片右上角装饰图标样式 */
const heroIconStyle: React.CSSProperties = {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 40,
    opacity: 0.2,
    color: '#fff',
};

/** 今日流量内嵌白色卡片样式 */
const trafficCardBase: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getStatistics();
                setStats(data);
            } catch (error) {
                console.error('获取统计数据失败:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    /* 加载态居中显示 */
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

            {/* 核心指标 — 三张渐变英雄卡片 */}
            <Row gutter={[20, 20]}>
                {/* 总用户数 — 蓝色渐变 */}
                <Col xs={24} sm={12} md={8}>
                    <div
                        style={{
                            ...heroCardBase,
                            background: 'linear-gradient(135deg, #5B6EF5 0%, #8B9CF7 100%)',
                        }}
                    >
                        <UserOutlined style={heroIconStyle} />
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>总用户数</div>
                        <Statistic
                            value={stats?.totalUsers || 0}
                            valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 700 }}
                        />
                    </div>
                </Col>

                {/* 活跃订阅 — 紫色渐变 */}
                <Col xs={24} sm={12} md={8}>
                    <div
                        style={{
                            ...heroCardBase,
                            background: 'linear-gradient(135deg, #7C5BF5 0%, #A78BFA 100%)',
                        }}
                    >
                        <ThunderboltOutlined style={heroIconStyle} />
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>活跃订阅</div>
                        <Statistic
                            value={stats?.activeSubscriptions || 0}
                            valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 700 }}
                        />
                    </div>
                </Col>

                {/* 总收入 — 绿色渐变 */}
                <Col xs={24} sm={12} md={8}>
                    <div
                        style={{
                            ...heroCardBase,
                            background: 'linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)',
                        }}
                    >
                        <PayCircleOutlined style={heroIconStyle} />
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>总收入</div>
                        <Statistic
                            value={stats?.totalRevenue || 0}
                            precision={2}
                            valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 700 }}
                        />
                    </div>
                </Col>
            </Row>

            {/* 今日流量区域 */}
            <div
                style={{
                    marginTop: 28,
                    borderLeft: '3px solid #5B6EF5',
                    paddingLeft: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1A1D2E',
                }}
            >
                今日流量
            </div>

            <Row gutter={[20, 20]} style={{ marginTop: 16 }}>
                {/* 浏览量 (PV) */}
                <Col xs={24} sm={12}>
                    <div style={trafficCardBase}>
                        <Statistic
                            title="浏览量 (PV)"
                            value={stats?.todayPv || 0}
                            prefix={<EyeOutlined style={{ color: '#5B6EF5' }} />}
                            valueStyle={{ fontSize: 28 }}
                        />
                    </div>
                </Col>

                {/* 访客数 (UV) */}
                <Col xs={24} sm={12}>
                    <div style={trafficCardBase}>
                        <Statistic
                            title="访客数 (UV)"
                            value={stats?.todayUv || 0}
                            prefix={<TeamOutlined style={{ color: '#10B981' }} />}
                            valueStyle={{ fontSize: 28 }}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
