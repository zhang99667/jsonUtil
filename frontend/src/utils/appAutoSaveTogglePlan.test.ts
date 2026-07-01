import { describe, expect, it } from 'vitest';
import { buildAppAutoSaveTogglePlan } from './appAutoSaveTogglePlan';

describe('appAutoSaveTogglePlan', () => {
  it('没有活动文件时提示先打开或保存文件', () => {
    expect(buildAppAutoSaveTogglePlan({
      hasActiveFile: false,
      activeFileHasHandle: false,
      isAutoSaveEnabled: false,
    })).toEqual({
      type: 'error',
      message: '请先打开或保存文件后再启用自动保存',
    });
  });

  it('活动文件没有句柄时提示先保存当前标签', () => {
    expect(buildAppAutoSaveTogglePlan({
      hasActiveFile: true,
      activeFileHasHandle: false,
      isAutoSaveEnabled: false,
    })).toEqual({
      type: 'error',
      message: '请先保存当前标签后再启用自动保存',
    });
  });

  it('可用时从关闭切换为开启并返回成功文案', () => {
    expect(buildAppAutoSaveTogglePlan({
      hasActiveFile: true,
      activeFileHasHandle: true,
      isAutoSaveEnabled: false,
    })).toEqual({
      type: 'toggle',
      nextEnabled: true,
      message: '自动保存已开启',
    });
  });

  it('可用时从开启切换为关闭并返回成功文案', () => {
    expect(buildAppAutoSaveTogglePlan({
      hasActiveFile: true,
      activeFileHasHandle: true,
      isAutoSaveEnabled: true,
    })).toEqual({
      type: 'toggle',
      nextEnabled: false,
      message: '自动保存已关闭',
    });
  });
});
