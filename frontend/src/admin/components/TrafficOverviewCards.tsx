import React from 'react';
import { Card as AntCard, Col, Row, Statistic } from 'antd';
import {
  EyeOutlined,
  GlobalOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { CardProps } from 'antd';
import type { TrafficOverview } from '../services/traffic';
import { formatAdminCount } from '../utils/toolEventInsights';

const Card = AntCard as React.ComponentType<React.PropsWithChildren<CardProps>>;

interface TrafficOverviewCardsProps {
  days: number;
  overview: TrafficOverview | null;
}

interface OverviewMetric {
  key: string;
  title: string;
  value: string;
  suffix?: string;
  color: string;
  background: string;
  icon: React.ReactNode;
}

export const TrafficOverviewCards: React.FC<TrafficOverviewCardsProps> = ({ days, overview }) => {
  const isToday = days === 1;
  const metrics: OverviewMetric[] = [
    {
      key: 'page-views',
      title: isToday ? '今日浏览量 (PV)' : `${days}天总浏览量`,
      value: formatAdminCount(isToday ? (overview?.todayPv || 0) : (overview?.totalPv || 0)),
      color: '#5B6EF5',
      background: 'rgba(91,110,245,0.1)',
      icon: <EyeOutlined />,
    },
    {
      key: 'visitors',
      title: isToday ? '今日访客数 (UV)' : `${days}天总访客数`,
      value: formatAdminCount(isToday ? (overview?.todayUv || 0) : (overview?.totalUv || 0)),
      color: '#7C5BF5',
      background: 'rgba(124,91,245,0.1)',
      icon: <TeamOutlined />,
    },
    {
      key: 'average-page-views',
      title: isToday ? '人均浏览页数' : '日均PV',
      value: isToday
        ? (overview?.todayUv ? (overview.todayPv / overview.todayUv).toFixed(1) : '0')
        : formatAdminCount(overview?.avgDailyPv || 0),
      suffix: isToday ? '页' : undefined,
      color: '#10B981',
      background: 'rgba(16,185,129,0.1)',
      icon: <RiseOutlined />,
    },
    {
      key: 'unique-visitors',
      title: isToday ? '独立IP数' : '日均UV',
      value: formatAdminCount(isToday ? (overview?.todayUv ?? 0) : (overview?.avgDailyUv ?? 0)),
      color: '#F59E0B',
      background: 'rgba(245,158,11,0.1)',
      icon: <GlobalOutlined />,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {metrics.map(metric => (
        <Col key={metric.key} xs={24} sm={12} md={6}>
          <Card
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: metric.background,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: metric.color,
                fontSize: 18,
              }}>
                {metric.icon}
              </div>
              <Statistic
                title={metric.title}
                value={0}
                formatter={() => metric.value}
                suffix={metric.suffix}
                styles={{ content: { color: '#1A1D2E', fontSize: 26, fontWeight: 600, lineHeight: 1.2 } }}
              />
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
