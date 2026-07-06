import { describe, expect, it, vi } from 'vitest';
import { beginPreviewOutputDraft } from './appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import { runAppPreviewOutputChange } from './appPreviewOutputChangeHandler';
import {
  PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT,
  createPreviewOutputChangeHandlerInput,
} from './appPreviewOutputSyncTestFixture';

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
    const input = createPreviewOutputChangeHandlerInput();

    runAppPreviewOutputChange({ ...input, previewText: PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT });

    expect(beginPreviewOutputDraft).toHaveBeenCalledWith(
      input.isUpdatingFromOutput,
      input.pendingOutputValue,
      PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT
    );
    expect(input.updatePreviewValidation).toHaveBeenCalledWith(PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT);
    expect(scheduleAppPreviewOutputChangeTask).toHaveBeenCalledWith(expect.objectContaining({
      previewText: PREVIEW_OUTPUT_SYNC_PREVIEW_TEXT,
      inputRef: input.inputRef,
      fallbackContextRef: input.fallbackContextRef,
      pendingOutputValue: input.pendingOutputValue,
      scheduleOutputSync: input.scheduleOutputSync,
    }));
  });
});
