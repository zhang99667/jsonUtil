import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import {
  invalidResult,
  previewSyncMocks,
  resetPreviewOutputSyncTestFixture,
  executeAppPreviewOutputSyncMock,
  validateJsonForEditorMock,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';

describe('useAppPreviewOutputSync', () => {
  beforeEach(() => {
    resetPreviewOutputSyncTestFixture();
  });

  it('PREVIEW 编辑先暂存，防抖后回写 SOURCE 并延迟解锁', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');

    expect(result.pendingOutputValue.current).toBe('{"a":2}');
    expect(result.isUpdatingFromOutput.current).toBe(true);
    expect(result.onSetInput).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);

    expect(executeAppPreviewOutputSyncMock).toHaveBeenCalledWith({
      previewText: '{"a":2}',
      mode: TransformMode.FORMAT,
      originalInput: '{"a":1}',
      context: null,
      validateJsonMaybeAsync: result.validateJsonMaybeAsync,
    });
    expect(result.onSetInput).toHaveBeenCalledWith('next-source');
    expect(result.inputRef.current).toBe('next-source');
    expect(result.onUpdateActiveFileContent).toHaveBeenCalledWith('next-source');
    expect(result.isUpdatingFromOutput.current).toBe(true);

    await vi.advanceTimersByTimeAsync(600);

    expect(result.pendingOutputValue.current).toBe('');
    expect(result.isUpdatingFromOutput.current).toBe(false);
  });

  it('格式化类 PREVIEW 校验失败时不覆盖 SOURCE', async () => {
    const result = useHookInput(vi.fn(async () => invalidResult));
    vi.mocked(executeAppPreviewOutputSyncMock).mockResolvedValueOnce({
      status: 'invalid',
      validation: invalidResult,
    });

    result.handleOutputChange('{bad');
    await vi.advanceTimersByTimeAsync(400);

    expect(previewSyncMocks.setPreviewValidation).toHaveBeenCalledWith(invalidResult);
    expect(result.onSetInput).not.toHaveBeenCalled();
    expect(result.onUpdateActiveFileContent).not.toHaveBeenCalled();
    expect(result.pendingOutputValue.current).toBe('');
    expect(result.isUpdatingFromOutput.current).toBe(false);
  });

  it('连续编辑时只同步最后一次 PREVIEW 内容', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');
    result.handleOutputChange('{"a":3}');
    await vi.advanceTimersByTimeAsync(400);

    expect(executeAppPreviewOutputSyncMock).toHaveBeenCalledTimes(1);
    expect(executeAppPreviewOutputSyncMock).toHaveBeenCalledWith(expect.objectContaining({
      previewText: '{"a":3}',
    }));
    expect(result.onSetInput).toHaveBeenCalledTimes(1);
  });

  it('派生 PREVIEW 为空时立即清理旧校验错误', () => {
    useHookInput(undefined, '');

    expect(previewSyncMocks.setPreviewValidation).toHaveBeenCalledWith({ isValid: true });
    expect(validateJsonForEditorMock).not.toHaveBeenCalled();
  });
});
