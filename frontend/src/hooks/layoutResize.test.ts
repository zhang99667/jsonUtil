import { describe, expect, it } from 'vitest';
import {
  clampLayoutValue,
  getPaneMouseResizePercent,
  getSidebarMouseResizeWidth,
} from './layoutResize';

describe('layoutResize', () => {
  it('收敛通用布局数值边界', () => {
    expect(clampLayoutValue(10, 20, 80)).toBe(20);
    expect(clampLayoutValue(50, 20, 80)).toBe(50);
    expect(clampLayoutValue(90, 20, 80)).toBe(80);
  });

  it('按鼠标位置计算侧栏宽度并限制范围', () => {
    expect(getSidebarMouseResizeWidth(120)).toBe(180);
    expect(getSidebarMouseResizeWidth(260)).toBe(260);
    expect(getSidebarMouseResizeWidth(460)).toBe(400);
  });

  it('按编辑区内相对位置计算左右面板比例', () => {
    const baseInput = {
      appLeft: 10,
      appWidth: 1010,
      sidebarWidth: 210,
    };

    expect(getPaneMouseResizePercent({ ...baseInput, clientX: 620 })).toBe(50);
    expect(getPaneMouseResizePercent({ ...baseInput, clientX: 300 })).toBe(20);
    expect(getPaneMouseResizePercent({ ...baseInput, clientX: 940 })).toBe(80);
  });
});
