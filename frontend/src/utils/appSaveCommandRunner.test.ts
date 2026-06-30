import { describe, expect, it, vi } from 'vitest';
import {
  runAppSaveShortcutCommand,
  runAppToolbarSaveCommand,
} from './appSaveCommandRunner';

const createEffectsBase = () => ({
  onSaveFile: vi.fn(async (_content?: string) => true),
  onSaveSourceAs: vi.fn(async () => true),
  onSavePreviewAs: vi.fn(async () => true),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
  onTrackToolEvent: vi.fn(),
  now: () => 123,
});

const createEffects = (overrides: Partial<ReturnType<typeof createEffectsBase>> = {}) => ({
  ...createEffectsBase(),
  ...overrides,
});

describe('appSaveCommandRunner', () => {
  it('快捷键保存 PREVIEW 处理中时跳过并提示', async () => {
    const effects = createEffects();

    await runAppSaveShortcutCommand({
      activeEditor: 'PREVIEW',
      hasActiveFile: true,
      activeFileHasHandle: true,
      previewText: '{"ok":true}',
      isOutputTransforming: true,
    }, effects);

    expect(effects.onShowError).toHaveBeenCalledWith('预览仍在处理，请稍后再保存');
    expect(effects.onSaveFile).not.toHaveBeenCalled();
    expect(effects.onSavePreviewAs).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith('SAVE_SHORTCUT', 'file', 'skipped', 123);
  });

  it('快捷键保存 PREVIEW 有文件句柄时写回当前文件', async () => {
    const effects = createEffects();

    await runAppSaveShortcutCommand({
      activeEditor: 'PREVIEW',
      hasActiveFile: true,
      activeFileHasHandle: true,
      previewText: '{"preview":1}',
      isOutputTransforming: false,
    }, effects);

    expect(effects.onSaveFile).toHaveBeenCalledWith('{"preview":1}');
    expect(effects.onShowSuccess).toHaveBeenCalledWith('已将 PREVIEW 内容保存到文件');
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith('SAVE_SHORTCUT', 'file', 'success', 123);
  });

  it('快捷键保存 PREVIEW 无文件句柄时保持静默 skipped', async () => {
    const effects = createEffects();

    await runAppSaveShortcutCommand({
      activeEditor: 'PREVIEW',
      hasActiveFile: true,
      activeFileHasHandle: false,
      previewText: '{"preview":1}',
      isOutputTransforming: false,
    }, effects);

    expect(effects.onSaveFile).not.toHaveBeenCalled();
    expect(effects.onSaveSourceAs).not.toHaveBeenCalled();
    expect(effects.onShowError).not.toHaveBeenCalled();
    expect(effects.onShowSuccess).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith('SAVE_SHORTCUT', 'file', 'skipped', 123);
  });

  it('工具栏保存 PREVIEW 始终走预览另存为', async () => {
    const effects = createEffects();

    await runAppToolbarSaveCommand({
      activeEditor: 'PREVIEW',
      hasActiveFile: true,
    }, effects);

    expect(effects.onSavePreviewAs).toHaveBeenCalledTimes(1);
    expect(effects.onSaveFile).not.toHaveBeenCalled();
    expect(effects.onSaveSourceAs).not.toHaveBeenCalled();
    expect(effects.onShowSuccess).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith('SAVE', 'file', 'success', 123);
  });

  it('工具栏保存 SOURCE 时按是否已有文件选择保存或另存为', async () => {
    const activeFileEffects = createEffects();
    await runAppToolbarSaveCommand({
      activeEditor: 'SOURCE',
      hasActiveFile: true,
    }, activeFileEffects);

    expect(activeFileEffects.onSaveFile).toHaveBeenCalledWith();
    expect(activeFileEffects.onShowSuccess).toHaveBeenCalledWith('已保存源文件');
    expect(activeFileEffects.onTrackToolEvent).toHaveBeenCalledWith('SAVE', 'file', 'success', 123);

    const saveAsEffects = createEffects();
    await runAppToolbarSaveCommand({
      activeEditor: null,
      hasActiveFile: false,
    }, saveAsEffects);

    expect(saveAsEffects.onSaveSourceAs).toHaveBeenCalledTimes(1);
    expect(saveAsEffects.onShowSuccess).toHaveBeenCalledWith('已另存为源文件');
    expect(saveAsEffects.onTrackToolEvent).toHaveBeenCalledWith('SAVE', 'file', 'success', 123);
  });
});
