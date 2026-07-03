import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { beginPreviewOutputDraft } from './appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import { runAppPreviewOutputChange } from './appPreviewOutputChangeHandler';

vi.mock('./appPreviewOutputDraft', async importOriginal => ({
  ...await importOriginal<typeof import('./appPreviewOutputDraft')>(),
  beginPreviewOutputDraft: vi.fn(),
}));

vi.mock('./appPreviewOutputChangeTask', async importOriginal => ({
  ...await importOriginal<typeof import('./appPreviewOutputChangeTask')>(),
  scheduleAppPreviewOutputChangeTask: vi.fn(),
}));

const createInput = () => ({
  files: [],
  activeFileId: null,
  mode: TransformMode.FORMAT,
  inputRef: { current: '{"a":1}' },
  fallbackContextRef: { current: null },
  isUpdatingFromOutput: { current: false },
  pendingOutputValue: { current: '' },
  validateJsonMaybeAsync: vi.fn(),
  onSetInput: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
  setPreviewValidation: vi.fn(),
  updatePreviewValidation: vi.fn(),
  scheduleOutputSync: vi.fn(),
});

describe('appPreviewOutputChangeHandler', () => {
  it('开始草稿、即时校验并调度同步任务', () => {
    const input = createInput();

    runAppPreviewOutputChange({ ...input, previewText: '{"a":2}' });

    expect(beginPreviewOutputDraft).toHaveBeenCalledWith(
      input.isUpdatingFromOutput,
      input.pendingOutputValue,
      '{"a":2}'
    );
    expect(input.updatePreviewValidation).toHaveBeenCalledWith('{"a":2}');
    expect(scheduleAppPreviewOutputChangeTask).toHaveBeenCalledWith(expect.objectContaining({
      previewText: '{"a":2}',
      inputRef: input.inputRef,
      pendingOutputValue: input.pendingOutputValue,
      scheduleOutputSync: input.scheduleOutputSync,
    }));
  });
});
