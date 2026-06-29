import { describe, expect, it } from 'vitest';
import {
  getPaneKeyboardResizePercent,
  getSidebarKeyboardResizeWidth,
} from './layoutKeyboardResize';

describe('layoutKeyboardResize', () => {
  it('按方向键调整侧栏宽度', () => {
    expect(getSidebarKeyboardResizeWidth(220, 'ArrowLeft', false)).toBe(204);
    expect(getSidebarKeyboardResizeWidth(220, 'ArrowRight', false)).toBe(236);
    expect(getSidebarKeyboardResizeWidth(220, 'ArrowRight', true)).toBe(252);
  });

  it('侧栏宽度支持 Home/End 和边界收敛', () => {
    expect(getSidebarKeyboardResizeWidth(220, 'Home', false)).toBe(180);
    expect(getSidebarKeyboardResizeWidth(220, 'End', false)).toBe(400);
    expect(getSidebarKeyboardResizeWidth(181, 'ArrowLeft', false)).toBe(180);
    expect(getSidebarKeyboardResizeWidth(399, 'ArrowRight', false)).toBe(400);
  });

  it('按方向键调整左右面板比例', () => {
    expect(getPaneKeyboardResizePercent(50, 'ArrowLeft', false)).toBe(45);
    expect(getPaneKeyboardResizePercent(50, 'ArrowRight', false)).toBe(55);
    expect(getPaneKeyboardResizePercent(50, 'ArrowLeft', true)).toBe(40);
  });

  it('左右面板比例支持 Home/End、边界收敛和无关按键忽略', () => {
    expect(getPaneKeyboardResizePercent(50, 'Home', false)).toBe(20);
    expect(getPaneKeyboardResizePercent(50, 'End', false)).toBe(80);
    expect(getPaneKeyboardResizePercent(21, 'ArrowLeft', false)).toBe(20);
    expect(getPaneKeyboardResizePercent(79, 'ArrowRight', false)).toBe(80);
    expect(getPaneKeyboardResizePercent(50, 'Tab', false)).toBeNull();
  });
});
