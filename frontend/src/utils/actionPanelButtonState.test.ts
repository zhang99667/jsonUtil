import { describe, expect, it } from 'vitest';
import {
  getActionPanelButtonClassName,
  getActionPanelPanelButtonA11y,
  getActionPanelToolButtonA11y,
} from './actionPanelButtonState';

describe('actionPanelButtonState', () => {
  it('根据 active 和 collapsed 状态生成工具栏按钮 class', () => {
    const activeExpanded = getActionPanelButtonClassName({
      isActive: true,
      isCollapsed: false,
    });
    const inactiveCollapsed = getActionPanelButtonClassName({
      isActive: false,
      isCollapsed: true,
    });

    expect(activeExpanded).toContain('bg-editor-active');
    expect(activeExpanded).toContain('shadow-[inset_3px_0_0_rgba(96,165,250,0.72)]');
    expect(activeExpanded).not.toContain('ring-');
    expect(activeExpanded).not.toContain('border-brand-primary');
    expect(activeExpanded).not.toContain('justify-center');
    expect(inactiveCollapsed).toContain('bg-editor-sidebar');
    expect(inactiveCollapsed).toContain('justify-center');
  });

  it('只在折叠态生成转换工具按钮可访问文案', () => {
    expect(getActionPanelToolButtonA11y('格式化', true, false)).toEqual({});
    expect(getActionPanelToolButtonA11y('格式化', true, true)).toEqual({
      ariaLabel: '格式化，当前模式',
      title: '格式化（当前）',
    });
    expect(getActionPanelToolButtonA11y('压缩', false, true)).toEqual({
      ariaLabel: '压缩',
      title: '压缩',
    });
  });

  it('只在折叠态生成面板入口按钮可访问文案', () => {
    expect(getActionPanelPanelButtonA11y('结构导航', true, false)).toEqual({});
    expect(getActionPanelPanelButtonA11y('结构导航', true, true)).toEqual({
      ariaLabel: '结构导航，已打开',
      title: '结构导航（已打开）',
    });
    expect(getActionPanelPanelButtonA11y('Schema', false, true)).toEqual({
      ariaLabel: 'Schema，未打开',
      title: 'Schema',
    });
  });
});
