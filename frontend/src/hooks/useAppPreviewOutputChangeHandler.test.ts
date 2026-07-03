import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { runAppPreviewOutputChange } from '../utils/appPreviewOutputChangeHandler';
import { useAppPreviewOutputChangeHandler } from './useAppPreviewOutputChangeHandler';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/appPreviewOutputChangeHandler', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPreviewOutputChangeHandler')>(),
  runAppPreviewOutputChange: vi.fn(),
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

  it('将 PREVIEW 输出变更转发给 helper', () => {
    const input = createInput();
    const handleOutputChange = useAppPreviewOutputChangeHandler(input);

    handleOutputChange('{"a":2}');

    expect(runAppPreviewOutputChange).toHaveBeenCalledWith(expect.objectContaining({
      previewText: '{"a":2}',
      inputRef: input.inputRef,
      pendingOutputValue: input.pendingOutputValue,
      scheduleOutputSync: input.scheduleOutputSync,
    }));
  });
});
