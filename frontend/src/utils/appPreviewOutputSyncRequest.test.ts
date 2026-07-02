import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab, type TransformContext } from '../types';
import {
  executeAppPreviewOutputSync,
  PREVIEW_OUTPUT_SYNC_FAILED,
} from './appPreviewOutputSyncRunner';
import {
  resolveAppPreviewOutputSyncContext,
  runAppPreviewOutputSyncRequest,
} from './appPreviewOutputSyncRequest';

vi.mock('./appPreviewOutputSyncRunner', async importOriginal => ({
  ...await importOriginal<typeof import('./appPreviewOutputSyncRunner')>(),
  executeAppPreviewOutputSync: vi.fn(async () => ({ status: 'synced', nextSource: 'next' })),
}));

const createContext = (timestamp: number): TransformContext => ({
  mode: TransformMode.DEEP_FORMAT,
  records: new Map(),
  timestamp,
  originalIndentation: 2,
});

const createTab = (id: string, transformContext?: TransformContext): FileTab => ({
  id,
  name: `${id}.json`,
  content: '{}',
  transformContext,
});

const createRequestInput = (files: FileTab[], fallbackContext: TransformContext | null) => ({
  previewText: '{"a":2}',
  files,
  activeFileId: 'active',
  mode: TransformMode.FORMAT,
  originalInput: '{"a":1}',
  fallbackContext,
  validateJsonMaybeAsync: vi.fn(async () => ({ isValid: true })),
});

describe('appPreviewOutputSyncRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(executeAppPreviewOutputSync).mockResolvedValue({ status: 'synced', nextSource: 'next' });
  });

  it('优先使用当前标签页的转换上下文', () => {
    const activeContext = createContext(1);
    const fallbackContext = createContext(2);

    expect(resolveAppPreviewOutputSyncContext(
      [createTab('active', activeContext)],
      'active',
      fallbackContext
    )).toBe(activeContext);
  });

  it('当前标签页没有上下文时使用 fallback', async () => {
    const fallbackContext = createContext(3);
    const input = createRequestInput([createTab('active')], fallbackContext);

    await runAppPreviewOutputSyncRequest(input);

    expect(executeAppPreviewOutputSync).toHaveBeenCalledWith(expect.objectContaining({
      context: fallbackContext,
      originalInput: input.originalInput,
      previewText: input.previewText,
    }));
  });

  it('runner 异常时统一返回失败结果', async () => {
    vi.mocked(executeAppPreviewOutputSync).mockRejectedValueOnce(new Error('sync failed'));

    const result = await runAppPreviewOutputSyncRequest(createRequestInput([], null));

    expect(result).toEqual({ status: 'failed', validation: PREVIEW_OUTPUT_SYNC_FAILED });
  });
});
