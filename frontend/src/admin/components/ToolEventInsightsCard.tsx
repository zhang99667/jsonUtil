import React from 'react';
import { Card as AntCard, Col, Row, Statistic, Tag } from 'antd';
import { BarChartOutlined, WarningOutlined } from '@ant-design/icons';
import type { CardProps } from 'antd';
import type { ToolEventGroupItem, ToolEventStats } from '../services/traffic';
import {
  buildToolEventInsights,
  buildToolEventWeeklyReport,
  formatAdminCount,
  type ToolEventWeeklyTone,
} from '../utils/toolEventInsights';
import { chartThemeColors } from '../styles/theme';
import { DistributionList } from './DistributionListCard';

const Card = AntCard as React.ComponentType<React.PropsWithChildren<CardProps>>;

const TOOL_EVENT_LABELS: Readonly<Record<string, string>> = {
  FORMAT: '格式化',
  DEEP_FORMAT: '嵌套解析',
  MINIFY: '压缩',
  ESCAPE: '转义',
  UNESCAPE: '反转义',
  UNICODE_TO_CN: 'Unicode 转中文',
  CN_TO_UNICODE: '中文转 Unicode',
  URL_ENCODE: 'URL 编码',
  URL_DECODE: 'URL 解码',
  BASE64_ENCODE: 'Base64 编码',
  BASE64_DECODE: 'Base64 解码',
  SORT_KEYS: 'Key 排序',
  AI_FIX: 'AI 修复',
  SAVE: '保存',
  SAVE_SHORTCUT: '快捷键保存',
  SOURCE_PASTE: '粘贴源内容',
  SOURCE_COPY: '复制源内容',
  SOURCE_CLEAR: '清空源内容',
  PREVIEW_COPY: '复制预览内容',
  PREVIEW_APPLY_TO_SOURCE: '预览应用到源',
  OPEN: '打开文件',
  NEW_TAB: '新建标签',
  JSONPATH_OPEN: '打开 JSONPath',
  JSONPATH_CLOSE: '关闭 JSONPath',
  JSONPATH_LOCATE: '定位 JSONPath',
  JSONPATH_QUERY: 'JSONPath 查询',
  STRUCTURE_NAV_LOCATE: '结构导航定位',
  SCHEMA_PANEL_OPEN: '打开 Schema 校验',
  SCHEMA_PANEL_CLOSE: '关闭 Schema 校验',
  SCHEMA_VALIDATE: 'Schema 校验',
  SCHEME_PANEL_OPEN: '打开 Scheme 面板',
  SCHEME_PANEL_CLOSE: '关闭 Scheme 面板',
  SCHEME_OPEN_FROM_REPORT: '报告打开 Scheme',
  SCHEME_OPEN_FROM_SOURCE_STATUS: '状态栏打开 Scheme',
  TEMPLATE_PANEL_OPEN: '打开模板填充',
  TEMPLATE_PANEL_CLOSE: '关闭模板填充',
  TEMPLATE_OPEN_FROM_REPORT: '报告打开模板',
  SETTINGS_OPEN: '打开设置',
  success: '成功',
  error: '失败',
  skipped: '跳过',
  cancelled: '取消',
  empty: '空输入',
  lt_10kb: '< 10KB',
  '10_50kb': '10-50KB',
  '50_250kb': '50-250KB',
  '250kb_1mb': '250KB-1MB',
  gt_1mb: '> 1MB',
  instant: '即时',
  lt_100ms: '< 100ms',
  '100_500ms': '100-500ms',
  '500ms_2s': '0.5-2s',
  '2_10s': '2-10s',
  gt_10s: '> 10s',
  unknown: '未知',
};

const getToolEventLabel = (label: string): string => TOOL_EVENT_LABELS[label] || label;

const getWeeklyToneColor = (tone: ToolEventWeeklyTone): string => {
  if (tone === 'success') return chartThemeColors.success;
  if (tone === 'warning') return chartThemeColors.warning;
  if (tone === 'danger') return chartThemeColors.danger;
  return chartThemeColors.primary;
};

const getWeeklyToneBackground = (tone: ToolEventWeeklyTone): string => {
  if (tone === 'success') return 'rgba(16,185,129,0.08)';
  if (tone === 'warning') return 'rgba(245,158,11,0.1)';
  if (tone === 'danger') return 'rgba(239,68,68,0.08)';
  return 'rgba(91,110,245,0.08)';
};

interface ToolEventListProps {
  items: ToolEventGroupItem[];
  color: string;
}

const ToolEventList: React.FC<ToolEventListProps> = ({ items, color }) => (
  <DistributionList
    items={items.map(item => ({
      key: item.label,
      label: getToolEventLabel(item.label),
      count: item.count,
      percentage: item.percentage,
    }))}
    strokeColor={color}
    emptyText="暂无工具事件数据"
    itemGap={12}
    labelGap={12}
    emptyPadding={24}
  />
);

interface ToolEventInsightsCardProps {
  days: number;
  stats: ToolEventStats | null;
}

export const ToolEventInsightsCard: React.FC<ToolEventInsightsCardProps> = ({ days, stats }) => {
  const insights = buildToolEventInsights(stats);
  const weeklyReport = buildToolEventWeeklyReport(stats, days, getToolEventLabel);

  return (
    <Card
      title={(
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1D2E' }}>
          <BarChartOutlined style={{ marginRight: 8, color: chartThemeColors.success }} />
          工具使用洞察
        </span>
      )}
      variant="borderless"
      style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Statistic
            title="工具事件"
            value={stats?.totalEvents || 0}
            formatter={value => formatAdminCount(Number(value))}
            styles={{ content: { color: '#1A1D2E', fontSize: 28, fontWeight: 600, lineHeight: 1.2 } }}
          />
        </Col>
        <Col xs={24} md={6}>
          <Statistic
            title="失败事件"
            value={stats?.failedEvents || 0}
            formatter={value => formatAdminCount(Number(value))}
            styles={{ content: {
              color: stats?.failedEvents ? chartThemeColors.danger : chartThemeColors.success,
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1.2,
            } }}
          />
        </Col>
        <Col xs={24} md={6}>
          <Statistic
            title="失败率"
            value={stats?.failureRate || 0}
            suffix="%"
            styles={{ content: {
              color: stats?.failureRate ? chartThemeColors.danger : chartThemeColors.success,
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1.2,
            } }}
          />
        </Col>
        <Col xs={24} md={6}>
          <Statistic
            title="最常用功能"
            value={0}
            formatter={() => insights.topEventLabel ? getToolEventLabel(insights.topEventLabel) : '-'}
            styles={{ content: { color: '#1A1D2E', fontSize: 20, fontWeight: 600, lineHeight: 1.3 } }}
          />
          {insights.topEventCount > 0 && (
            <div style={{ color: '#9CA3BE', fontSize: 12, marginTop: 4 }}>
              {formatAdminCount(insights.topEventCount)} 次 · {insights.topEventPercentage}%
            </div>
          )}
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={8}>
          <div style={{ border: '1px solid #EEF0F6', borderRadius: 8, padding: 14, background: '#FAFBFF' }}>
            <Statistic
              title="大输入事件"
              value={insights.largeInputPercentage}
              suffix="%"
              styles={{ content: { color: '#1A1D2E', fontSize: 22, fontWeight: 600 } }}
            />
            <div style={{ color: '#9CA3BE', fontSize: 12 }}>
              {formatAdminCount(insights.largeInputEvents)} 次 · 50KB 以上
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={{ border: '1px solid #EEF0F6', borderRadius: 8, padding: 14, background: '#FAFBFF' }}>
            <Statistic
              title="慢操作事件"
              value={insights.slowPercentage}
              suffix="%"
              styles={{ content: {
                color: insights.slowPercentage >= 10 ? chartThemeColors.warning : '#1A1D2E',
                fontSize: 22,
                fontWeight: 600,
              } }}
            />
            <div style={{ color: '#9CA3BE', fontSize: 12 }}>
              {formatAdminCount(insights.slowEvents)} 次 · 2 秒以上
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={{
            border: '1px solid #EEF0F6',
            borderRadius: 8,
            padding: 14,
            background: '#FAFBFF',
            minHeight: 92,
          }}>
            <div style={{ color: '#5A607F', fontSize: 13, marginBottom: 8 }}>
              <WarningOutlined style={{ marginRight: 6, color: chartThemeColors.warning }} />
              建议动作
            </div>
            <div style={{ color: '#1A1D2E', fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
              {insights.recommendation}
            </div>
          </div>
        </Col>
      </Row>

      <div
        data-tour="tool-event-weekly-report"
        style={{
          marginTop: 20,
          border: '1px solid #E7EAF5',
          borderRadius: 8,
          padding: 16,
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#1A1D2E', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              PM 周报 · {weeklyReport.periodLabel}
            </div>
            <div style={{ color: '#5A607F', fontSize: 13, lineHeight: 1.6 }}>
              {weeklyReport.headline}
            </div>
          </div>
          <Tag color={weeklyReport.isEmpty ? 'default' : 'blue'} style={{ marginInlineEnd: 0 }}>
            {weeklyReport.isEmpty ? '待观测' : '可复盘'}
          </Tag>
        </div>

        <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
          {weeklyReport.metrics.map(metric => (
            <Col key={metric.key} xs={24} sm={12} lg={6}>
              <div
                data-tour={`tool-event-weekly-metric-${metric.key}`}
                style={{
                  height: '100%',
                  minHeight: 94,
                  border: '1px solid #EEF0F6',
                  borderRadius: 8,
                  padding: 12,
                  background: getWeeklyToneBackground(metric.tone),
                }}
              >
                <div style={{ color: '#5A607F', fontSize: 12, marginBottom: 6 }}>{metric.label}</div>
                <div style={{
                  color: getWeeklyToneColor(metric.tone),
                  fontSize: 20,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                }}>
                  {metric.value}
                </div>
                <div style={{ color: '#7A819D', fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>
                  {metric.helper}
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 14 }}>
          <Col xs={24} lg={12}>
            <div style={{ color: '#1A1D2E', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              重点关注
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {weeklyReport.focusItems.map(item => (
                <div
                  key={item.key}
                  data-tour={`tool-event-weekly-focus-${item.key}`}
                  style={{
                    borderLeft: `3px solid ${getWeeklyToneColor(item.tone)}`,
                    borderRadius: 6,
                    background: getWeeklyToneBackground(item.tone),
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ color: '#1A1D2E', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {item.title}
                  </div>
                  <div style={{ color: '#5A607F', fontSize: 12, lineHeight: 1.5 }}>
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div style={{ color: '#1A1D2E', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              下周动作
            </div>
            <div style={{
              display: 'grid',
              gap: 10,
              border: '1px solid #EEF0F6',
              borderRadius: 8,
              padding: 12,
              background: '#FAFBFF',
            }}>
              {weeklyReport.actionItems.map((item, index) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'rgba(91,110,245,0.12)',
                    color: chartThemeColors.primary,
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ color: '#5A607F', fontSize: 12, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={8}>
          <div style={{ color: '#1A1D2E', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>高频功能</div>
          <ToolEventList items={stats?.topEvents || []} color={chartThemeColors.primary} />
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ color: '#1A1D2E', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>输入大小</div>
          <ToolEventList items={stats?.inputSizeDistribution || []} color={chartThemeColors.info} />
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ color: '#1A1D2E', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>耗时分布</div>
          <ToolEventList items={stats?.durationDistribution || []} color={chartThemeColors.warning} />
        </Col>
      </Row>
    </Card>
  );
};
