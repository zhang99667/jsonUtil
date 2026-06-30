import { describe, expect, it } from 'vitest';
import { buildAppSaveShortcutPlan } from './appSaveShortcutPlan';
import { buildAppToolbarSavePlan } from './appSaveToolbarPlan';

describe('appSaveActionPlan', () => {
  it('快捷键保存 PREVIEW 处理中时跳过', () => {
    expect(buildAppSaveShortcutPlan({
      activeEditor: 'PREVIEW',
      hasActiveFile: true,
      isOutputTransforming: true,
    })).toEqual({
      action: 'skip',
      reason: 'preview-transforming',
      message: '预览仍在处理，请稍后再保存',
    });
  });

  it('快捷键保存保留 PREVIEW 写回当前文件的历史语义', () => {
    expect(buildAppSaveShortcutPlan({
      activeEditor: 'PREVIEW',
      hasActiveFile: true,
      activeFileHasHandle: true,
    })).toEqual({
      action: 'save-preview-to-file',
      successMessage: '已将 PREVIEW 内容保存到文件',
    });
  });

  it('快捷键保存 PREVIEW 且当前文件无句柄时保持静默 skipped', () => {
    expect(buildAppSaveShortcutPlan({
      activeEditor: 'PREVIEW',
      hasActiveFile: true,
      activeFileHasHandle: false,
    })).toEqual({
      action: 'skip',
      reason: 'preview-active-file-without-handle',
    });
  });

  it('快捷键保存 SOURCE 时按是否已有文件选择保存或另存为', () => {
    expect(buildAppSaveShortcutPlan({
      activeEditor: 'SOURCE',
      hasActiveFile: true,
    })).toEqual({
      action: 'save-source-to-file',
      successMessage: '已将 SOURCE 内容保存到文件',
    });
    expect(buildAppSaveShortcutPlan({
      activeEditor: null,
      hasActiveFile: false,
    })).toEqual({
      action: 'save-source-as',
      successMessage: '已另存为源文件',
    });
  });

  it('快捷键保存 PREVIEW 且无文件时另存为预览结果', () => {
    expect(buildAppSaveShortcutPlan({
      activeEditor: 'PREVIEW',
      hasActiveFile: false,
    })).toEqual({ action: 'save-preview-as' });
  });

  it('工具栏保存 PREVIEW 始终走预览另存为，由 savePreview 处理处理中状态', () => {
    expect(buildAppToolbarSavePlan({
      activeEditor: 'PREVIEW',
      hasActiveFile: true,
      isOutputTransforming: true,
    })).toEqual({ action: 'save-preview-as' });
  });

  it('工具栏保存 SOURCE 时按是否已有文件选择保存或另存为', () => {
    expect(buildAppToolbarSavePlan({
      activeEditor: 'SOURCE',
      hasActiveFile: true,
    })).toEqual({
      action: 'save-source-to-file',
      successMessage: '已保存源文件',
    });
    expect(buildAppToolbarSavePlan({
      activeEditor: null,
      hasActiveFile: false,
    })).toEqual({
      action: 'save-source-as',
      successMessage: '已另存为源文件',
    });
  });
});
