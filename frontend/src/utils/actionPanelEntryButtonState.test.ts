import { describe, expect, it } from 'vitest';
import {
  getActionPanelPanelEntryButtonState,
  getActionPanelToolEntryButtonState,
} from './actionPanelEntryButtonState';

describe('actionPanelEntryButtonState', () => {
  it('生成转换工具按钮入口状态', () => {
    expect(getActionPanelToolEntryButtonState({
      label: '格式化',
      colorClass: 'text-blue-400',
      isActive: true,
      isCollapsed: true,
    })).toEqual({
      entryProps: {
        isActive: true,
        ariaLabel: '格式化，当前模式',
        title: '格式化（当前）',
        badge: { label: '当前', dataTour: 'active-mode-badge' },
      },
      iconState: {
        iconWrapperClassName: 'transition-colors text-blue-400',
        iconInnerClassName: 'text-blue-400',
      },
    });
  });

  it('生成面板入口按钮入口状态', () => {
    expect(getActionPanelPanelEntryButtonState({
      label: '结构导航',
      iconClass: 'text-cyan-300',
      hoverIconClass: 'group-hover:text-cyan-300',
      isOpen: false,
      isCollapsed: true,
    })).toEqual({
      entryProps: {
        isActive: false,
        ariaLabel: '结构导航，未打开',
        title: '结构导航',
        badge: undefined,
      },
      iconState: {
        iconWrapperClassName: 'transition-colors text-gray-500 group-hover:text-cyan-300',
      },
    });
  });
});
