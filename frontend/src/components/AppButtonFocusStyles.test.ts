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
  it('全局按钮键盘焦点会压掉 Tailwind ring 选中框', () => {
    const focusRule = getRuleBody(appCss, ':where(button, [role="button"]):focus-visible');

    expect(focusRule).toContain('--tw-ring-offset-shadow: 0 0 #0000 !important');
    expect(focusRule).toContain('--tw-ring-shadow: 0 0 #0000 !important');
    expect(focusRule).toContain('filter: brightness(1.05) saturate(1.02)');
    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow, none) !important');
    expect(focusRule).not.toContain('focus-visible:ring');
    expect(focusRule).not.toContain('outline: auto');
  });

  it('全局 app-button 键盘焦点不再绘制额外外框或光晕', () => {
    const buttonRule = getRuleBody(appCss, '.app-button');
    const accentRule = getRuleBody(appCss, '.app-button::after');
    const focusRule = getRuleBody(appCss, '.app-button:focus-visible');
    const focusAccentRule = getRuleBody(appCss, '.app-button:focus-visible::after');

    expect(buttonRule).toContain('--app-button-focus-accent: rgba(203, 213, 225, 0.46)');
    expect(accentRule).toContain('height: 1px');
    expect(focusRule).toContain('filter: brightness(1.035) saturate(1.01)');
    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow) !important');
    expect(focusAccentRule).toContain('opacity: 1');
    expect(focusAccentRule).toContain('transform: scaleX(1)');
    expect(focusRule).not.toContain('--app-focus-halo');
    expect(focusRule).not.toContain('0 0 18px');
    expect(focusRule).not.toContain('inset 0 0 0 1px');
    expect(focusRule).not.toContain('inset 0 -2px');
    expect(appCss).not.toContain('rgba(94, 234, 212');
  });

  it('主按钮不再使用高饱和蓝色按钮底和外框阴影', () => {
    const buttonRule = getRuleBody(appCss, '.app-button--primary');
    const toastButtonRule = getRuleBody(releaseToastCss, '.app-release-toast__button--primary');

    expect(buttonRule).toContain('rgba(55, 69, 88, 0.98)');
    expect(buttonRule).not.toContain('#1487c9');
    expect(buttonRule).not.toContain('rgba(0, 122, 204');
    expect(toastButtonRule).toContain('rgba(55, 69, 88, 0.98)');
    expect(toastButtonRule).not.toContain('#1487c9');
    expect(toastButtonRule).not.toContain('rgba(0, 122, 204');
  });

  it('版本弹窗确认按钮是低圆角无外框实体按钮', () => {
    const buttonRule = getRuleBody(appCss, '.changelog-modal__confirm-button');
    const focusRule = getRuleBody(appCss, '.changelog-modal__confirm-button:focus-visible');

    expect(buttonRule).toContain('border-radius: 7px');
    expect(buttonRule).toContain('min-width: 76px');
    expect(buttonRule).toContain('rgba(52, 63, 78, 0.98)');
    expect(buttonRule).not.toContain('999px');
    expect(buttonRule).not.toContain('#1487c9');
    expect(buttonRule).not.toContain('rgba(0, 122, 204');
    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow) !important');
    expect(focusRule).not.toContain('0 0 18px');
    expect(focusRule).not.toContain('inset 0 0 0 1px');
    expect(appCss).not.toContain('changelog-modal__confirm-button::after');
  });

  it('鼠标点击 app-button 不会留下内部焦点细线', () => {
    const focusRule = getRuleBody(appCss, '.app-button:focus:not(:focus-visible)');
    const focusAccentRule = getRuleBody(appCss, '.app-button:focus:not(:focus-visible)::after');

    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow)');
    expect(focusAccentRule).toContain('opacity: 0');
  });

  it('版本更新 Toast 按钮焦点不再绘制额外外框或厚底线', () => {
    const focusRule = getRuleBody(releaseToastCss, '.app-release-toast__button:focus-visible');

    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow)');
    expect(focusRule).not.toContain('0 0 18px');
    expect(focusRule).not.toContain('inset 0 -2px');
  });

  it('版本更新 Toast 容器不再使用旧蓝色描边', () => {
    const toastRule = getRuleBody(releaseToastCss, '.app-release-toast');

    expect(toastRule).toContain('rgba(148, 163, 184, 0.16)');
    expect(toastRule).not.toContain('rgba(0, 122, 204');
  });
});
