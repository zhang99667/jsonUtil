import { describe, expect, it, vi } from 'vitest';
import {
  runAppCopyPreviewCommand,
  runAppCopySourceCommand,
} from './appCopyCommandRunner';

const createEffectsBase = () => ({
  onCopyText: vi.fn(async (_text: string) => undefined),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
  onTrackToolEvent: vi.fn(),
  now: () => 456,
});

const createEffects = (overrides: Partial<ReturnType<typeof createEffectsBase>> = {}) => ({
  ...createEffectsBase(),
  ...overrides,
});

describe('appCopyCommandRunner', () => {
  it('SOURCE 为空时跳过复制并打 skipped', async () => {
    const effects = createEffects();

    await runAppCopySourceCommand('  ', effects);

    expect(effects.onCopyText).not.toHaveBeenCalled();
    expect(effects.onShowError).toHaveBeenCalledWith('源内容为空，暂无可复制内容');
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith('SOURCE_COPY', 'editor', 'skipped', 456);
  });

  it('复制 SOURCE 成功时提示内容大小并打 success', async () => {
    const effects = createEffects();

    await runAppCopySourceCommand('中文', effects);

    expect(effects.onCopyText).toHaveBeenCalledWith('中文');
    expect(effects.onShowSuccess).toHaveBeenCalledWith('已复制源内容（2 字符 / 6 B）');
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith('SOURCE_COPY', 'editor', 'success', 456);
  });

  it('复制 SOURCE 失败时使用源内容失败兜底文案', async () => {
    const effects = createEffects({
      onCopyText: vi.fn(async () => {
        throw 'blocked';
      }),
    });

    await runAppCopySourceCommand('abc', effects);

    expect(effects.onShowError).toHaveBeenCalledWith('复制源内容失败');
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith('SOURCE_COPY', 'editor', 'error', 456);
  });

  it('PREVIEW 处理中或为空时跳过复制', async () => {
    const transformingEffects = createEffects();
    await runAppCopyPreviewCommand('{"ok":true}', true, transformingEffects);
    expect(transformingEffects.onShowError).toHaveBeenCalledWith('预览仍在处理，请稍后复制');
    expect(transformingEffects.onCopyText).not.toHaveBeenCalled();
    expect(transformingEffects.onTrackToolEvent).toHaveBeenCalledWith('PREVIEW_COPY', 'editor', 'skipped', 456);

    const emptyEffects = createEffects();
    await runAppCopyPreviewCommand('   ', false, emptyEffects);
    expect(emptyEffects.onShowError).toHaveBeenCalledWith('预览内容为空，暂无可复制内容');
    expect(emptyEffects.onCopyText).not.toHaveBeenCalled();
    expect(emptyEffects.onTrackToolEvent).toHaveBeenCalledWith('PREVIEW_COPY', 'editor', 'skipped', 456);
  });

  it('复制 PREVIEW 成功或失败时保持原有文案和打点', async () => {
    const successEffects = createEffects();
    await runAppCopyPreviewCommand('abc', false, successEffects);
    expect(successEffects.onCopyText).toHaveBeenCalledWith('abc');
    expect(successEffects.onShowSuccess).toHaveBeenCalledWith('已复制预览内容（3 字符 / 3 B）');
    expect(successEffects.onTrackToolEvent).toHaveBeenCalledWith('PREVIEW_COPY', 'editor', 'success', 456);

    const failEffects = createEffects({
      onCopyText: vi.fn(async () => {
        throw new Error('浏览器拒绝复制操作');
      }),
    });
    await runAppCopyPreviewCommand('abc', false, failEffects);
    expect(failEffects.onShowError).toHaveBeenCalledWith('浏览器拒绝复制操作');
    expect(failEffects.onTrackToolEvent).toHaveBeenCalledWith('PREVIEW_COPY', 'editor', 'error', 456);
  });
});
