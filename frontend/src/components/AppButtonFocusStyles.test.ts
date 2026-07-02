import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appCss = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const releaseToastCss = readFileSync(new URL('./AppReleaseToast.css', import.meta.url), 'utf8');

const getRuleBody = (css: string, selector: string): string => {
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

describe('App button focus styles', () => {
  it('全局 app-button 键盘焦点使用轻光晕而不是描边选中框', () => {
    const focusRule = getRuleBody(appCss, '.app-button:focus-visible');

    expect(focusRule).toContain('var(--app-focus-halo)');
    expect(focusRule).not.toContain('inset 0 0 0 1px');
    expect(focusRule).not.toContain('inset 0 -2px');
  });

  it('版本弹窗确认按钮是无外框胶囊按钮', () => {
    const buttonRule = getRuleBody(appCss, '.changelog-modal__confirm-button');
    const focusRule = getRuleBody(appCss, '.changelog-modal__confirm-button:focus-visible');

    expect(buttonRule).toContain('border-radius: 999px');
    expect(buttonRule).toContain('min-width: 84px');
    expect(focusRule).toContain('0 0 18px rgba(56, 189, 248, 0.18)');
    expect(focusRule).not.toContain('inset 0 0 0 1px');
    expect(appCss).not.toContain('changelog-modal__confirm-button::after');
  });

  it('版本更新 Toast 按钮焦点不再绘制厚底线', () => {
    const focusRule = getRuleBody(releaseToastCss, '.app-release-toast__button:focus-visible');

    expect(focusRule).toContain('0 0 18px rgba(56, 189, 248, 0.18)');
    expect(focusRule).not.toContain('inset 0 -2px');
  });
});
