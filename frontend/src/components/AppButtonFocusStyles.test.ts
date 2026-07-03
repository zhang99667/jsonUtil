import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appCss = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const indexEntrySource = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const finalButtonStateCss = readFileSync(new URL('../styles/buttonStateOverrides.css', import.meta.url), 'utf8');
const releaseToastCss = readFileSync(new URL('./AppReleaseToast.css', import.meta.url), 'utf8');
const driverTourCss = readFileSync(new URL('../styles/driverTourOverrides.css', import.meta.url), 'utf8');

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
  it('主应用只从入口脚本加载样式，并最后导入按钮状态覆盖层', () => {
    const indexCssImport = "import './index.css';";
    const buttonStateImport = "import './styles/buttonStateOverrides.css';";

    expect(indexHtml).not.toContain('/src/index.css');
    expect(indexEntrySource.indexOf(indexCssImport)).toBeGreaterThanOrEqual(0);
    expect(indexEntrySource.indexOf(buttonStateImport)).toBeGreaterThan(indexEntrySource.indexOf(indexCssImport));
  });

  it('全局按钮键盘焦点会压掉 Tailwind ring 选中框', () => {
    const focusRule = getRuleBody(appCss, ':where(button, [role="button"]):focus-visible');

    expect(focusRule).toContain('--tw-ring-offset-shadow: 0 0 #0000 !important');
    expect(focusRule).toContain('--tw-ring-shadow: 0 0 #0000 !important');
    expect(focusRule).toContain('--tw-ring-color: transparent !important');
    expect(focusRule).toContain('filter: brightness(1.05) saturate(1.02)');
    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow, none) !important');
    expect(focusRule).not.toContain('focus-visible:ring');
    expect(focusRule).not.toContain('outline: auto');
  });

  it('全局 app-button 键盘焦点只靠填充和亮度反馈，不再绘制额外外框或线条', () => {
    const buttonRule = getRuleBody(appCss, '.app-button');
    const focusRule = getRuleBody(appCss, '.app-button:focus-visible');

    expect(buttonRule).not.toContain('--app-button-focus-accent');
    expect(focusRule).toContain('filter: brightness(1.04) saturate(1.01)');
    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow) !important');
    expect(focusRule).not.toContain('--app-focus-halo');
    expect(focusRule).not.toContain('0 0 18px');
    expect(focusRule).not.toContain('inset 0 0 0 1px');
    expect(focusRule).not.toContain('inset 0 -2px');
    expect(appCss).not.toContain('.app-button::after');
    expect(appCss).not.toContain('rgba(94, 234, 212');
  });

  it('主按钮不再使用高饱和蓝色按钮底和选中框阴影', () => {
    const buttonRule = getRuleBody(appCss, '.app-button--primary');
    const toastButtonRule = getRuleBody(releaseToastCss, '.app-release-toast__button--primary');

    expect(buttonRule).toContain('rgba(76, 88, 104, 0.66)');
    expect(buttonRule).toContain('--app-button-rest-shadow: none');
    expect(buttonRule).not.toContain('inset 0');
    expect(buttonRule).not.toContain('0 8px');
    expect(buttonRule).not.toContain('#1487c9');
    expect(buttonRule).not.toContain('rgba(0, 122, 204');
    expect(toastButtonRule).toContain('rgba(76, 88, 104, 0.66)');
    expect(toastButtonRule).toContain('--app-button-rest-shadow: none');
    expect(toastButtonRule).not.toContain('inset 0');
    expect(toastButtonRule).not.toContain('0 8px');
    expect(toastButtonRule).not.toContain('#1487c9');
    expect(toastButtonRule).not.toContain('rgba(0, 122, 204');
  });

  it('版本弹窗确认按钮是低圆角无外框实体按钮', () => {
    const buttonRule = getRuleBody(appCss, '.changelog-modal__confirm-button');
    const focusRule = getRuleBody(appCss, '.changelog-modal__confirm-button:focus-visible');

    expect(buttonRule).toContain('border-radius: 6px');
    expect(buttonRule).toContain('min-height: 28px');
    expect(buttonRule).toContain('min-width: 76px');
    expect(buttonRule).toContain('background: linear-gradient(180deg, rgba(76, 88, 104, 0.68) 0%, rgba(49, 59, 72, 0.72) 100%) !important');
    expect(buttonRule).toContain('border: 0 !important');
    expect(buttonRule).toContain('box-shadow: none !important');
    expect(buttonRule).not.toContain('999px');
    expect(buttonRule).not.toContain('inset 0');
    expect(buttonRule).not.toContain('0 10px');
    expect(buttonRule).not.toContain('#1487c9');
    expect(buttonRule).not.toContain('rgba(0, 122, 204');
    expect(focusRule).toContain('--tw-ring-color: transparent !important');
    expect(focusRule).toContain('background: linear-gradient(180deg, rgba(88, 101, 118, 0.78) 0%, rgba(57, 68, 82, 0.8) 100%) !important');
    expect(focusRule).toContain('filter: brightness(1.04) saturate(1.01)');
    expect(focusRule).toContain('box-shadow: none !important');
    expect(focusRule).not.toContain('0 0 18px');
    expect(focusRule).not.toContain('inset 0 0 0 1px');
    expect(appCss).not.toContain('changelog-modal__confirm-button::after');
  });

  it('按钮最终覆盖层兜住后置 Tailwind ring 工具类', () => {
    const focusRule = getRuleBody(finalButtonStateCss, ':where(button, [role="button"]):focus-visible');
    const confirmFocusRule = getRuleBody(
      finalButtonStateCss,
      '.app-button.app-button--primary:focus-visible'
    );

    expect(focusRule).toContain('--tw-ring-offset-shadow: 0 0 #0000 !important');
    expect(focusRule).toContain('--tw-ring-shadow: 0 0 #0000 !important');
    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow, none) !important');
    expect(confirmFocusRule).toContain('background: linear-gradient(180deg, rgba(88, 101, 118, 0.78)');
    expect(confirmFocusRule).toContain('box-shadow: none !important');
    expect(finalButtonStateCss).not.toContain('#1487c9');
    expect(finalButtonStateCss).not.toContain('rgba(0, 122, 204');
  });

  it('鼠标点击 app-button 不会留下选中框或内部焦点线', () => {
    const focusRule = getRuleBody(appCss, '.app-button:focus:not(:focus-visible)');

    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow)');
    expect(appCss).not.toContain('.app-button:focus:not(:focus-visible)::after');
  });

  it('版本更新 Toast 按钮焦点不再绘制额外外框或厚底线', () => {
    const focusRule = getRuleBody(releaseToastCss, '.app-release-toast__button:focus-visible');

    expect(focusRule).toContain('box-shadow: var(--app-button-rest-shadow)');
    expect(focusRule).toContain('--tw-ring-color: transparent !important');
    expect(focusRule).not.toContain('0 0 18px');
    expect(focusRule).not.toContain('inset 0 -2px');
  });

  it('版本更新 Toast 容器不再使用旧蓝色描边', () => {
    const toastRule = getRuleBody(releaseToastCss, '.app-release-toast');

    expect(toastRule).toContain('rgba(148, 163, 184, 0.16)');
    expect(toastRule).not.toContain('rgba(0, 122, 204');
  });

  it('Driver 引导下一步按钮不再使用蓝绿描边或内部选中框', () => {
    const nextButtonRule = getRuleBody(
      driverTourCss,
      ':where(.driver-popover, .json-helper-tour-popover, .json-helper-feature-tour-popover) .driver-popover-footer .driver-popover-next-btn'
    );
    const nextFocusRule = getRuleBody(
      driverTourCss,
      ':where(.driver-popover, .json-helper-tour-popover, .json-helper-feature-tour-popover) .driver-popover-footer .driver-popover-next-btn:hover'
    );

    expect(nextButtonRule).toContain('background: linear-gradient(180deg, rgba(76, 88, 104, 0.68) 0%, rgba(49, 59, 72, 0.72) 100%) !important');
    expect(nextButtonRule).toContain('border: 0 !important');
    expect(nextButtonRule).toContain('box-shadow: none !important');
    expect(nextButtonRule).not.toContain('inset 0');
    expect(nextButtonRule).not.toContain('#1487c9');
    expect(nextButtonRule).not.toContain('rgba(0, 122, 204');
    expect(nextFocusRule).not.toContain('inset 0');
  });
});
