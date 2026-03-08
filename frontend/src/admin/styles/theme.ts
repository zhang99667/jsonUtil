import type { ThemeConfig } from 'antd';

/**
 * Ant Design 主题配置
 * 基于管理后台设计 Token 定义全局主题
 */
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: '#5B6EF5',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F7F8FC',
    colorText: '#1A1D2E',
    colorTextSecondary: '#5A607F',
    colorBorder: '#E8EAF2',
    colorSplit: '#F0F1F5',
    borderRadius: 8,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Noto Sans SC', sans-serif",
    fontSize: 14,
    controlHeight: 38,
  },
  components: {
    Button: { borderRadius: 8, controlHeight: 38 },
    Card: { borderRadiusLG: 12 },
    Input: { borderRadius: 8 },
    Select: { borderRadius: 8 },
    Modal: { borderRadiusLG: 16 },
    Table: { borderRadiusLG: 12, headerBg: '#F7F8FC', headerColor: '#5A607F' },
    Menu: { darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent' },
  },
};

/**
 * 图表主题配色
 * 供各页面 ECharts 等图表组件统一引用
 */
export const chartThemeColors = {
  primary: '#5B6EF5',
  secondary: '#7C5BF5',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#8B9CF7',
  muted: '#9CA3BE',
  palette: ['#5B6EF5', '#7C5BF5', '#10B981', '#F59E0B', '#8B9CF7', '#A78BFA', '#6EE7B7', '#FCD34D'],
};

/**
 * 渐变色定义
 * 用于卡片背景、侧边栏等区域的渐变效果
 */
export const gradients = {
  blue: 'linear-gradient(135deg, #5B6EF5 0%, #8B9CF7 100%)',
  violet: 'linear-gradient(135deg, #7C5BF5 0%, #A78BFA 100%)',
  emerald: 'linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)',
  amber: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
  sidebar: 'linear-gradient(180deg, #1E2235 0%, #262B44 100%)',
};
