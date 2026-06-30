import { describe, expect, it } from 'vitest';
import { createActionPanelEntryButtonState } from './actionPanelEntryButtonStateFactory';

describe('actionPanelEntryButtonStateFactory', () => {
  it('拼装入口按钮 props 与图标状态', () => {
    expect(createActionPanelEntryButtonState({
      isActive: true,
      ariaLabel: '格式化，当前模式',
      title: '格式化（当前）',
      badge: { label: '当前', dataTour: 'active-mode-badge' },
      iconState: {
        iconWrapperClassName: 'transition-colors text-blue-400',
        iconInnerClassName: 'text-blue-400',
      },
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
});
