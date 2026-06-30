import { describe, expect, it } from 'vitest';
import {
  getActionPanelAiFixButtonState,
  getActionPanelAiFixLabel,
  getActionPanelAiFixVisibleLabel,
  getActionPanelFileButtonTitle,
} from './actionPanelFileActions';

describe('actionPanelFileActions', () => {
  it('按处理状态生成 AI 修复无障碍文案', () => {
    expect(getActionPanelAiFixLabel(false)).toBe('智能修复');
    expect(getActionPanelAiFixLabel(true)).toBe('智能修复中，请等待当前任务完成');
  });

  it('按处理状态生成 AI 修复可见文案', () => {
    expect(getActionPanelAiFixVisibleLabel(false)).toBe('智能修复');
    expect(getActionPanelAiFixVisibleLabel(true)).toBe('修复中...');
  });

  it('生成 AI 修复按钮状态', () => {
    expect(getActionPanelAiFixButtonState(true, false)).toMatchObject({
      ariaLabel: '智能修复中，请等待当前任务完成',
      disabled: true,
      title: '智能修复中，请等待当前任务完成',
      visibleLabel: '修复中...',
    });
    expect(getActionPanelAiFixButtonState(false, true)).toMatchObject({
      ariaLabel: '智能修复',
      disabled: false,
      title: '智能修复',
      visibleLabel: '智能修复',
    });
    expect(getActionPanelAiFixButtonState(false, true).className).toContain('px-2');
  });

  it('只在折叠态为文件按钮补充 title', () => {
    expect(getActionPanelFileButtonTitle('打开文件', true)).toBe('打开文件');
    expect(getActionPanelFileButtonTitle('打开文件', false)).toBeUndefined();
  });
});
