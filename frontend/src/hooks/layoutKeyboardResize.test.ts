import { describe, expect, it, vi } from 'vitest';
import {
  applyLayoutKeyboardResize,
  getPaneKeyboardResizePercent,
  getSidebarKeyboardResizeWidth,
} from './layoutKeyboardResize';
import { createLayoutKeyboardEvent } from './layoutKeyboardResizeTestHelper';

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

  it('应用键盘调整时阻止默认行为并写入 next 值', () => {
    const event = createLayoutKeyboardEvent('ArrowRight');
    const onResize = vi.fn();

    expect(applyLayoutKeyboardResize({
      event,
      currentValue: 220,
      getNextValue: getSidebarKeyboardResizeWidth,
      onResize,
    })).toBe(true);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledWith(236);
  });

  it('无关按键不会阻止默认行为或写入状态', () => {
    const event = createLayoutKeyboardEvent('Tab');
    const onResize = vi.fn();

    expect(applyLayoutKeyboardResize({
      event,
      currentValue: 220,
      getNextValue: getSidebarKeyboardResizeWidth,
      onResize,
    })).toBe(false);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onResize).not.toHaveBeenCalled();
  });
});
