import { describe, expect, it, vi } from 'vitest';
import { applyAppPreviewOutputSyncResult } from './appPreviewOutputSyncResult';

const createEffects = () => ({
  inputRef: { current: '{"a":1}' },
  pendingOutputValue: { current: '' },
  setPreviewValidation: vi.fn(),
  onSetInput: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
});

describe('appPreviewOutputSyncResult', () => {
  it('同步失败时保留 PREVIEW 草稿且不覆盖 SOURCE', () => {
    const effects = createEffects();
    const result = applyAppPreviewOutputSyncResult({
      syncResult: { status: 'invalid', validation: { isValid: false, error: 'bad json' } },
      previewText: '',
      ...effects,
    });

    expect(result).toBe(false);
    expect(effects.pendingOutputValue.current).toBe('');
    expect(effects.inputRef.current).toBe('{"a":1}');
    expect(effects.setPreviewValidation).toHaveBeenCalledWith({ isValid: false, error: 'bad json' });
    expect(effects.onSetInput).not.toHaveBeenCalled();
    expect(effects.onUpdateActiveFileContent).not.toHaveBeenCalled();
  });

  it('同步成功时写回 SOURCE 和当前标签页内容', () => {
    const effects = createEffects();
    const result = applyAppPreviewOutputSyncResult({
      syncResult: { status: 'synced', nextSource: '{"a":2}' },
      previewText: '{"a":2}',
      ...effects,
    });

    expect(result).toBe(true);
    expect(effects.inputRef.current).toBe('{"a":2}');
    expect(effects.onSetInput).toHaveBeenCalledWith('{"a":2}');
    expect(effects.onUpdateActiveFileContent).toHaveBeenCalledWith('{"a":2}');
    expect(effects.setPreviewValidation).not.toHaveBeenCalled();
  });
});
