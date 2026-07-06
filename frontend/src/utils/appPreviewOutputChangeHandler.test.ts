import { describe, expect, it, vi } from 'vitest';
import { beginPreviewOutputDraft } from './appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import { runAppPreviewOutputChange } from './appPreviewOutputChangeHandler';
import { createPreviewOutputChangeTaskInput, PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT } from './appPreviewOutputSyncTestFixture';

vi.mock('./appPreviewOutputDraft', async importOriginal => ({
  ...await importOriginal<typeof import('./appPreviewOutputDraft')>(),
  beginPreviewOutputDraft: vi.fn(),
}));

vi.mock('./appPreviewOutputChangeTask', async importOriginal => ({
  ...await importOriginal<typeof import('./appPreviewOutputChangeTask')>(),
  scheduleAppPreviewOutputChangeTask: vi.fn(),
}));

describe('appPreviewOutputChangeHandler', () => {
  it('开始草稿、即时校验并调度同步任务', () => {
    const input = { ...createPreviewOutputChangeTaskInput(), isUpdatingFromOutput: { current: false }, updatePreviewValidation: vi.fn() };

    runAppPreviewOutputChange(input);

    expect(beginPreviewOutputDraft).toHaveBeenCalledWith(
      input.isUpdatingFromOutput,
      input.refs.pendingOutputValue,
      PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT
    );
    expect(input.updatePreviewValidation).toHaveBeenCalledWith(PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT);
    expect(scheduleAppPreviewOutputChangeTask).toHaveBeenCalledWith({
      request: input.request,
      refs: input.refs,
      applyEffects: input.applyEffects,
      scheduleOutputSync: input.scheduleOutputSync,
    });
  });
});
