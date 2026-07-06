import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type TransformContext } from '../types';
import { runAppPreviewOutputSyncRequest } from './appPreviewOutputSyncRequest';
import { applyAppPreviewOutputSyncResult } from './appPreviewOutputSyncResult';
import { createAppPreviewOutputSyncTask } from './appPreviewOutputSyncTask';

const syncedResult = { status: 'synced' as const, nextSource: 'next-source' };

vi.mock('./appPreviewOutputSyncRequest', () => ({
  runAppPreviewOutputSyncRequest: vi.fn(async () => syncedResult),
}));

vi.mock('./appPreviewOutputSyncResult', () => ({
  applyAppPreviewOutputSyncResult: vi.fn(() => true),
}));

const createTaskInput = () => ({
  request: {
    previewText: '{"a":2}',
    files: [],
    activeFileId: null,
    mode: TransformMode.FORMAT,
    validateJsonMaybeAsync: vi.fn(),
  },
  refs: {
    inputRef: { current: '{"a":1}' },
    fallbackContextRef: { current: null as TransformContext | null },
    pendingOutputValue: { current: '' },
  },
  applyEffects: {
    setPreviewValidation: vi.fn(),
    onSetInput: vi.fn(),
    onUpdateActiveFileContent: vi.fn(),
  },
});

describe('createAppPreviewOutputSyncTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runAppPreviewOutputSyncRequest).mockResolvedValue(syncedResult);
    vi.mocked(applyAppPreviewOutputSyncResult).mockReturnValue(true);
  });

  it('执行时读取最新 SOURCE 和 fallback context 快照', async () => {
    const input = createTaskInput();
    const fallbackContext = { timestamp: 100 } as TransformContext;
    const task = createAppPreviewOutputSyncTask(input);

    input.refs.inputRef.current = '{"latest":true}';
    input.refs.fallbackContextRef.current = fallbackContext;

    await expect(task(() => true)).resolves.toBe(true);

    expect(runAppPreviewOutputSyncRequest).toHaveBeenCalledWith(expect.objectContaining({
      originalInput: '{"latest":true}',
      fallbackContext,
    }));
    expect(applyAppPreviewOutputSyncResult).toHaveBeenCalledWith(expect.objectContaining({
      syncResult: syncedResult,
      previewText: input.request.previewText,
      inputRef: input.refs.inputRef,
      pendingOutputValue: input.refs.pendingOutputValue,
    }));
  });

  it('request 已失效时不应用同步结果', async () => {
    const input = createTaskInput();
    const task = createAppPreviewOutputSyncTask(input);

    await expect(task(() => false)).resolves.toBe(false);

    expect(runAppPreviewOutputSyncRequest).toHaveBeenCalledTimes(1);
    expect(applyAppPreviewOutputSyncResult).not.toHaveBeenCalled();
  });
});
