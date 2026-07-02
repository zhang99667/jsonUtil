import { beforeEach, describe, expect, it } from 'vitest';
import {
  executeAppPreviewOutputSyncMock,
  previewSyncMocks,
  resetPreviewOutputSyncTestFixture,
  useHookInput,
} from './useAppPreviewOutputSyncTestFixture';
import {
  advancePreviewSyncDebounce,
  expectOutputDraft,
} from './useAppPreviewOutputSyncTestAssertions';

const getPreviewSyncCleanup = (): (() => void) => {
  const cleanup = [...previewSyncMocks.useEffect.mock.results]
    .reverse()
    .find(({ value }) => typeof value === 'function')
    ?.value;

  if (typeof cleanup !== 'function') {
    throw new Error('未找到 PREVIEW 同步 cleanup');
  }

  return cleanup;
};

describe('useAppPreviewOutputSync cancel', () => {
  beforeEach(() => {
    resetPreviewOutputSyncTestFixture();
  });

  it('取消 PREVIEW 草稿时清理防抖同步，避免晚到任务覆盖 SOURCE', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');
    result.cancelOutputDraft();
    await advancePreviewSyncDebounce();

    expectOutputDraft(result, '', false);
    expect(executeAppPreviewOutputSyncMock).not.toHaveBeenCalled();
    expect(result.onSetInput).not.toHaveBeenCalled();
  });

  it('卸载时清理防抖同步，避免晚到任务覆盖 SOURCE', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');
    getPreviewSyncCleanup()();
    await advancePreviewSyncDebounce();

    expect(executeAppPreviewOutputSyncMock).not.toHaveBeenCalled();
    expect(result.onSetInput).not.toHaveBeenCalled();
  });
});
