import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { beginPreviewOutputDraft } from '../utils/appPreviewOutputDraft';
import { createAppPreviewOutputSyncTask } from '../utils/appPreviewOutputSyncTask';
import { useAppPreviewOutputChangeHandler } from './useAppPreviewOutputChangeHandler';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));
const task = vi.hoisted(() => vi.fn());

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/appPreviewOutputDraft', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPreviewOutputDraft')>(),
  beginPreviewOutputDraft: vi.fn(),
}));

vi.mock('../utils/appPreviewOutputSyncTask', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPreviewOutputSyncTask')>(),
  createAppPreviewOutputSyncTask: vi.fn(() => task),
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

describe('useAppPreviewOutputChangeHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('开始草稿、即时校验并调度同步任务', () => {
    const input = createInput();
    const handleOutputChange = useAppPreviewOutputChangeHandler(input);

    handleOutputChange('{"a":2}');

    expect(beginPreviewOutputDraft).toHaveBeenCalledWith(
      input.isUpdatingFromOutput,
      input.pendingOutputValue,
      '{"a":2}'
    );
    expect(input.updatePreviewValidation).toHaveBeenCalledWith('{"a":2}');
    expect(createAppPreviewOutputSyncTask).toHaveBeenCalledWith(expect.objectContaining({
      previewText: '{"a":2}',
      inputRef: input.inputRef,
      pendingOutputValue: input.pendingOutputValue,
    }));
    expect(input.scheduleOutputSync).toHaveBeenCalledWith(task);
  });
});
