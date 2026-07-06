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
    const fallbackContextRef = { current: null };
    const setPreviewValidation = vi.fn();
    const onSetInput = vi.fn();
    const onUpdateActiveFileContent = vi.fn();

    scheduleAppPreviewOutputChangeTask({
      previewText: '{"a":2}',
      files: [],
      activeFileId: null,
      mode: TransformMode.FORMAT,
      inputRef,
      fallbackContextRef,
      pendingOutputValue,
      validateJsonMaybeAsync: vi.fn(),
      setPreviewValidation,
      onSetInput,
      onUpdateActiveFileContent,
      scheduleOutputSync,
    });

    expect(createAppPreviewOutputSyncTask).toHaveBeenCalledWith({
      request: expect.objectContaining({ previewText: '{"a":2}' }),
      refs: { inputRef, fallbackContextRef, pendingOutputValue },
      applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
    });
    expect(scheduleOutputSync).toHaveBeenCalledWith(syncTask);
  });
});
