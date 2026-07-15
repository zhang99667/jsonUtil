import type { ThemeConfig } from 'antd';

const ADMIN_COLOR_SEEDS = {
  primary: '#5B6EF5',
  secondary: '#7C5BF5',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B9CF7',
  muted: '#9CA3BE',
} as const;

const ADMIN_SURFACE_COLORS = {
  container: '#FFFFFF',
  layout: '#F7F8FC',
  text: '#1A1D2E',
  textSecondary: '#5A607F',
  border: '#E8EAF2',
  split: '#F0F1F5',
} as const;

const ADMIN_GRADIENT_COLORS = {
  violetEnd: '#A78BFA',
  emeraldEnd: '#6EE7B7',
  amberEnd: '#FCD34D',
  sidebarStart: '#1E2235',
  sidebarEnd: '#262B44',
} as const;

/**
 * Ant Design 主题配置
 * 基于管理后台设计 Token 定义全局主题
 */
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: ADMIN_COLOR_SEEDS.primary,
    colorSuccess: ADMIN_COLOR_SEEDS.success,
    colorWarning: ADMIN_COLOR_SEEDS.warning,
    colorError: ADMIN_COLOR_SEEDS.danger,
    colorInfo: ADMIN_COLOR_SEEDS.info,
    colorBgContainer: ADMIN_SURFACE_COLORS.container,
    colorBgLayout: ADMIN_SURFACE_COLORS.layout,
    colorText: ADMIN_SURFACE_COLORS.text,
    colorTextSecondary: ADMIN_SURFACE_COLORS.textSecondary,
    colorBorder: ADMIN_SURFACE_COLORS.border,
    colorSplit: ADMIN_SURFACE_COLORS.split,
    borderRadius: 8,
    borderRadiusLG: 12,
    boxShadowTertiary: '0 2px 8px rgba(0,0,0,0.04)',
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
    Table: {
      borderRadiusLG: 12,
      headerBg: ADMIN_SURFACE_COLORS.layout,
      headerColor: ADMIN_SURFACE_COLORS.textSecondary,
    },
    Menu: { darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent' },
  },
};

/**
 * 图表主题配色
 * 供各页面 ECharts 等图表组件统一引用
 */
export const chartThemeColors = {
  ...ADMIN_COLOR_SEEDS,
  palette: [
    ADMIN_COLOR_SEEDS.primary,
    ADMIN_COLOR_SEEDS.secondary,
    ADMIN_COLOR_SEEDS.success,
    ADMIN_COLOR_SEEDS.warning,
    ADMIN_COLOR_SEEDS.info,
    ADMIN_GRADIENT_COLORS.violetEnd,
    ADMIN_GRADIENT_COLORS.emeraldEnd,
    ADMIN_GRADIENT_COLORS.amberEnd,
  ],
};

/**
 * 渐变色定义
 * 用于卡片背景、侧边栏等区域的渐变效果
 */
export const gradients = {
  blue: `linear-gradient(135deg, ${ADMIN_COLOR_SEEDS.primary} 0%, ${ADMIN_COLOR_SEEDS.info} 100%)`,
  violet: `linear-gradient(135deg, ${ADMIN_COLOR_SEEDS.secondary} 0%, ${ADMIN_GRADIENT_COLORS.violetEnd} 100%)`,
  emerald: `linear-gradient(135deg, ${ADMIN_COLOR_SEEDS.success} 0%, ${ADMIN_GRADIENT_COLORS.emeraldEnd} 100%)`,
  amber: `linear-gradient(135deg, ${ADMIN_COLOR_SEEDS.warning} 0%, ${ADMIN_GRADIENT_COLORS.amberEnd} 100%)`,
  sidebar: `linear-gradient(180deg, ${ADMIN_GRADIENT_COLORS.sidebarStart} 0%, ${ADMIN_GRADIENT_COLORS.sidebarEnd} 100%)`,
};
