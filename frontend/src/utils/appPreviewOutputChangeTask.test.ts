import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { createAppPreviewOutputSyncTask } from './appPreviewOutputSyncTask';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';

const syncTask = vi.hoisted(() => vi.fn());

vi.mock('./appPreviewOutputSyncTask', async importOriginal => ({
  ...await importOriginal<typeof import('./appPreviewOutputSyncTask')>(),
  createAppPreviewOutputSyncTask: vi.fn(() => syncTask),
}));

describe('appPreviewOutputChangeTask', () => {
  it('创建 PREVIEW 同步任务并交给 scheduler', () => {
    const scheduleOutputSync = vi.fn();
    const inputRef = { current: '{"a":1}' };
    const pendingOutputValue = { current: '' };

    scheduleAppPreviewOutputChangeTask({
      previewText: '{"a":2}',
      files: [],
      activeFileId: null,
      mode: TransformMode.FORMAT,
      inputRef,
      fallbackContextRef: { current: null },
      pendingOutputValue,
      validateJsonMaybeAsync: vi.fn(),
      setPreviewValidation: vi.fn(),
      onSetInput: vi.fn(),
      onUpdateActiveFileContent: vi.fn(),
      scheduleOutputSync,
    });

    expect(createAppPreviewOutputSyncTask).toHaveBeenCalledWith(expect.objectContaining({
      previewText: '{"a":2}',
      inputRef,
      pendingOutputValue,
    }));
    expect(scheduleOutputSync).toHaveBeenCalledWith(syncTask);
  });
});
