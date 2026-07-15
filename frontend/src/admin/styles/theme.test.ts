import { describe, expect, it } from 'vitest';
import { adminTheme, chartThemeColors, gradients } from './theme';

describe('管理后台主题', () => {
  it('Ant Design 语义色与图表主题共享同一组颜色种子', () => {
    expect(adminTheme.token).toMatchObject({
      colorPrimary: chartThemeColors.primary,
      colorSuccess: chartThemeColors.success,
      colorWarning: chartThemeColors.warning,
      colorError: chartThemeColors.danger,
      colorInfo: chartThemeColors.info,
    });
  });

  it('指标卡渐变复用图表主题颜色', () => {
    expect(gradients.blue).toContain(chartThemeColors.primary);
    expect(gradients.blue).toContain(chartThemeColors.info);
    expect(gradients.violet).toContain(chartThemeColors.secondary);
    expect(gradients.emerald).toContain(chartThemeColors.success);
    expect(gradients.amber).toContain(chartThemeColors.warning);
  });

  it('卡片圆角和轻阴影保持既有视觉规格', () => {
    expect(adminTheme.token).toMatchObject({
      borderRadiusLG: 12,
      boxShadowTertiary: '0 2px 8px rgba(0,0,0,0.04)',
    });
  });
});
