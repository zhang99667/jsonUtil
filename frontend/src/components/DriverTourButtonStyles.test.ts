import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

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
      '.json-helper-tour-popover .driver-popover-footer .driver-popover-next-btn,'
    );

    expect(buttonRule).toContain('rgba(55, 69, 88, 0.98)');
    expect(buttonRule).toContain('border-radius: 999px');
    expect(buttonRule).not.toContain('#1487c9');
    expect(buttonRule).not.toContain('rgba(0, 122, 204');
  });

  it('引导按钮键盘焦点不再绘制描边或厚底线选中框', () => {
    const focusRule = getRuleBody(
      '.json-helper-tour-popover .driver-popover-footer .driver-popover-next-btn:focus-visible,'
    );

    expect(focusRule).toContain('rgba(66, 82, 104, 0.98)');
    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow) !important');
    expect(focusRule).not.toContain('0 0 18px');
    expect(focusRule).not.toContain('inset 0 0 0 1px');
    expect(focusRule).not.toContain('inset 0 -2px');
    expect(css).not.toContain('driver-popover-next-btn::after');
  });
});
