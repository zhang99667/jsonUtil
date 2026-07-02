import { beforeEach, describe, expect, it } from 'vitest';
import {
  previewSyncMocks,
  resetPreviewOutputSyncTestFixture,
  executeAppPreviewOutputSyncMock,
  validateJsonForEditorMock,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';
import * as previewSync from './useAppPreviewOutputSyncTestAssertions';

describe('useAppPreviewOutputSync', () => {
  beforeEach(() => {
    resetPreviewOutputSyncTestFixture();
  });

  it('PREVIEW 编辑先暂存，防抖后回写 SOURCE 并延迟解锁', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');

    previewSync.expectOutputDraft(result, '{"a":2}', true);
    previewSync.expectSourceUnchanged(result);

    await previewSync.advancePreviewSyncDebounce();

    previewSync.expectPreviewSyncRequest(executeAppPreviewOutputSyncMock, result, '{"a":2}');
    expect(result.onSetInput).toHaveBeenCalledWith('next-source');
    expect(result.inputRef.current).toBe('next-source');
    expect(result.onUpdateActiveFileContent).toHaveBeenCalledWith('next-source');
    previewSync.expectOutputDraft(result, '{"a":2}', true);

    await previewSync.advancePreviewUnlockDelay();

    previewSync.expectOutputDraft(result, '', false);
  });

  it('格式化类 PREVIEW 校验失败时不覆盖 SOURCE', async () => {
    const result = previewSync.useInvalidPreviewSyncInput();

    result.handleOutputChange('{bad');
    await previewSync.advancePreviewSyncDebounce();

    previewSync.expectInvalidPreviewValidation();
    previewSync.expectSourceUnchanged(result);
    previewSync.expectOutputDraft(result, '{bad', true);
  });

  it('PREVIEW 删空后同步失败时保留空草稿', async () => {
    const result = previewSync.useInvalidPreviewSyncInput();

    result.handleOutputChange('');
    await previewSync.advancePreviewSyncDebounce();

    previewSync.expectInvalidPreviewValidation();
    expect(result.onSetInput).not.toHaveBeenCalled();
    previewSync.expectOutputDraft(result, '', true);
  });

  it('连续编辑时只同步最后一次 PREVIEW 内容', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');
    result.handleOutputChange('{"a":3}');
    await previewSync.advancePreviewSyncDebounce();

    expect(executeAppPreviewOutputSyncMock).toHaveBeenCalledTimes(1);
    previewSync.expectPreviewSyncRequest(executeAppPreviewOutputSyncMock, result, '{"a":3}');
    expect(result.onSetInput).toHaveBeenCalledTimes(1);
  });

  it('派生 PREVIEW 为空时立即清理旧校验错误', () => {
    useHookInput(undefined, '');

    expect(previewSyncMocks.setPreviewValidation).toHaveBeenCalledWith({ isValid: true });
    expect(validateJsonForEditorMock).not.toHaveBeenCalled();
  });
});
