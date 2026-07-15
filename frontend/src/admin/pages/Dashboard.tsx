import React, { useEffect, useRef, useState } from 'react';
import { Row, Col, Statistic, Spin, Typography, theme } from 'antd';
import { UserOutlined, PayCircleOutlined, ThunderboltOutlined, EyeOutlined, TeamOutlined, DashboardOutlined } from '@ant-design/icons';
import { getStatistics, Statistics } from '../services/stats';
import { gradients } from '../styles/theme';

const { Title } = Typography;

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const statsRequestIdRef = useRef(0);
    const { token } = theme.useToken();
    const heroCardBase: React.CSSProperties = {
        borderRadius: 16,
        padding: 28,
        position: 'relative',
        overflow: 'hidden',
        color: token.colorTextLightSolid,
    };
    const heroIconStyle: React.CSSProperties = {
        position: 'absolute',
        top: 20,
        right: 20,
        fontSize: 40,
        opacity: 0.2,
        color: token.colorTextLightSolid,
    };
    const heroValueStyle: React.CSSProperties = {
        color: token.colorTextLightSolid,
        fontSize: 32,
        fontWeight: 700,
    };
    const trafficCardBase: React.CSSProperties = {
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        padding: 24,
        boxShadow: token.boxShadowTertiary,
    };

    useEffect(() => {
        const requestId = ++statsRequestIdRef.current;

        const fetchStats = async () => {
            try {
                const data = await getStatistics();
                // 页面切走或重新请求后，旧响应不再回写概览数据。
                if (requestId !== statsRequestIdRef.current) {
                    return;
                }
                setStats(data);
            } catch (error) {
                if (requestId !== statsRequestIdRef.current) {
                    return;
                }
                console.error('获取统计数据失败:', error);
            } finally {
                if (requestId === statsRequestIdRef.current) {
                    setLoading(false);
                }
            }
        };
        fetchStats();

        return () => {
            statsRequestIdRef.current += 1;
        };
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
                            background: gradients.blue,
                        }}
                    >
                        <UserOutlined style={heroIconStyle} />
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>总用户数</div>
                        <Statistic
                            value={stats?.totalUsers || 0}
                            valueStyle={heroValueStyle}
                        />
                    </div>
                </Col>

                {/* 活跃订阅 — 紫色渐变 */}
                <Col xs={24} sm={12} md={8}>
                    <div
                        style={{
                            ...heroCardBase,
                            background: gradients.violet,
                        }}
                    >
                        <ThunderboltOutlined style={heroIconStyle} />
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>活跃订阅</div>
                        <Statistic
                            value={stats?.activeSubscriptions || 0}
                            valueStyle={heroValueStyle}
                        />
                    </div>
                </Col>

                {/* 总收入 — 绿色渐变 */}
                <Col xs={24} sm={12} md={8}>
                    <div
                        style={{
                            ...heroCardBase,
                            background: gradients.emerald,
                        }}
                    >
                        <PayCircleOutlined style={heroIconStyle} />
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>总收入</div>
                        <Statistic
                            value={stats?.totalRevenue || 0}
                            precision={2}
                            valueStyle={heroValueStyle}
                        />
                    </div>
                </Col>
            </Row>

            {/* 今日流量区域 */}
            <div
                style={{
                    marginTop: 28,
                    borderLeft: `3px solid ${token.colorPrimary}`,
                    paddingLeft: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    color: token.colorText,
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
                            prefix={<EyeOutlined style={{ color: token.colorPrimary }} />}
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
                            prefix={<TeamOutlined style={{ color: token.colorSuccess }} />}
                            valueStyle={{ fontSize: 28 }}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
