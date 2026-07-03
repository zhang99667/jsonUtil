import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../styles/driverTourOverrides.css', import.meta.url), 'utf8');

const getRuleBody = (selector: string): string => {
  const selectorStart = css.indexOf(selector);
  if (selectorStart < 0) {
    throw new Error(`未找到 CSS 选择器: ${selector}`);
  }

  const bodyStart = css.indexOf('{', selectorStart);
  const bodyEnd = css.indexOf('}', bodyStart);
  if (bodyStart < 0 || bodyEnd < 0) {
    throw new Error(`CSS 规则不完整: ${selector}`);
  }

  return css.slice(bodyStart + 1, bodyEnd);
};

describe('Driver tour button styles', () => {
  it('引导主按钮不复用高饱和蓝色主按钮视觉', () => {
    const buttonRule = getRuleBody(
      ':where(.driver-popover, .json-helper-tour-popover, .json-helper-feature-tour-popover) .driver-popover-footer .driver-popover-next-btn'
    );

    expect(buttonRule).toContain('background: rgba(255, 255, 255, 0.085) !important');
    expect(buttonRule).toContain('--app-button-rest-shadow: none');
    expect(buttonRule).toContain('box-shadow: none !important');
    expect(buttonRule).toContain('border: 0 !important');
    expect(buttonRule).toContain('border-radius: 7px');
    expect(buttonRule).not.toContain('999px');
    expect(buttonRule).not.toContain('inset 0');
    expect(buttonRule).not.toContain('0 8px');
    expect(buttonRule).not.toContain('#1487c9');
    expect(buttonRule).not.toContain('rgba(0, 122, 204');
  });

  it('引导按钮键盘焦点只靠填充反馈，不再绘制外框或内侧线条', () => {
    const buttonRule = getRuleBody(
      ':where(.driver-popover, .json-helper-tour-popover, .json-helper-feature-tour-popover) .driver-popover-footer button'
    );
    const focusRule = getRuleBody(
      ':where(.driver-popover, .json-helper-tour-popover, .json-helper-feature-tour-popover) .driver-popover-footer button:focus-visible'
    );

    expect(buttonRule).not.toContain('--driver-button-focus-accent');
    expect(focusRule).toContain('background: rgba(255, 255, 255, 0.095) !important');
    expect(focusRule).toContain('--tw-ring-color: transparent !important');
    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow');
    expect(focusRule).not.toContain('0 0 18px');
    expect(focusRule).not.toContain('inset 0 0 0 1px');
    expect(focusRule).not.toContain('inset 0 -2px');
    expect(css).not.toContain('rgba(94, 234, 212');
    expect(css).not.toContain('driver-popover-footer button::before');
    expect(css).not.toContain('driver-popover-next-btn::after');
  });

  it('鼠标点击焦点不会留下选中框', () => {
    const focusRule = getRuleBody(
      ':where(.driver-popover, .json-helper-tour-popover, .json-helper-feature-tour-popover) .driver-popover-footer button:focus:not(:focus-visible)'
    );

    expect(focusRule).toContain('border: 0 !important');
    expect(focusRule).toContain('outline: none !important');
    expect(css).not.toContain('focus:not(:focus-visible)::before');
    expect(css).not.toContain('button:hover::before');
  });
});
