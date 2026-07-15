import React from 'react';
import { Card as AntCard, Progress } from 'antd';
import type { CardProps } from 'antd';
import { formatAdminCount } from '../utils/toolEventInsights';

const Card = AntCard as React.ComponentType<React.PropsWithChildren<CardProps>>;

export interface DistributionListItem {
  key: React.Key;
  label: React.ReactNode;
  count: number;
  percentage: number;
}

export interface DistributionListProps {
  items: readonly DistributionListItem[];
  strokeColor: string;
  emptyText: string;
  itemGap?: number;
  labelGap?: number;
  contentPadding?: React.CSSProperties['padding'];
  emptyPadding?: React.CSSProperties['padding'];
}

interface DistributionListCardProps {
  title: React.ReactNode;
  items: readonly DistributionListItem[];
  strokeColor: string;
  emptyText: string;
}

export const DistributionList: React.FC<DistributionListProps> = ({
  items,
  strokeColor,
  emptyText,
  itemGap = 16,
  labelGap,
  contentPadding,
  emptyPadding = 40,
}) => {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3BE', padding: emptyPadding }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: itemGap, padding: contentPadding }}>
      {items.map(item => (
        <div key={item.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: labelGap, marginBottom: 6 }}>
            <span style={{ color: '#1A1D2E', fontSize: 13 }}>{item.label}</span>
            <span style={{ color: '#9CA3BE', fontSize: 13 }}>
              {formatAdminCount(item.count)} ({item.percentage}%)
            </span>
          </div>
          <Progress
            percent={item.percentage}
            showInfo={false}
            strokeColor={strokeColor}
            trailColor="#F0F1F5"
            size="small"
          />
        </div>
      ))}
    </div>
  );
};

export const DistributionListCard: React.FC<DistributionListCardProps> = ({
  title,
  items,
  strokeColor,
  emptyText,
}) => (
  <Card
    title={title}
    bordered={false}
    style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
  >
    <DistributionList
      items={items}
      strokeColor={strokeColor}
      emptyText={emptyText}
      contentPadding="8px 0"
    />
  </Card>
);
