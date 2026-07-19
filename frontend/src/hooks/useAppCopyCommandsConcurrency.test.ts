import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppCopyCommands } from './useAppCopyCommands';

const clipboardMocks = vi.hoisted(() => ({ copyText: vi.fn() }));
const copyIntentRef = vi.hoisted(() => ({ current: 0 }));
const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn((callback: unknown) => callback),
  useMemo: vi.fn((factory: () => unknown) => factory()),
  useRef: vi.fn(() => copyIntentRef),
}));
const toastMocks = vi.hoisted(() => ({ showError: vi.fn(), showSuccess: vi.fn() }));
const commandInput = {
  previewText: '',
  isOutputTransforming: false,
  onTrackToolEvent: vi.fn(),
};

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  ...reactMocks,
}));
vi.mock('../utils/clipboard', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/clipboard')>(),
  copyText: clipboardMocks.copyText,
}));
vi.mock('../utils/toast', () => toastMocks);

const createCopyDeferred = () => {
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((_resolve, rejectPromise) => { reject = rejectPromise; });
  return { promise, reject };
};

describe('useAppCopyCommands 连续复制', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    copyIntentRef.current = 0;
  });

  it('新请求成功后忽略旧请求迟到失败的副作用', async () => {
    const older = createCopyDeferred();
    clipboardMocks.copyText.mockReturnValueOnce(older.promise).mockResolvedValueOnce(undefined);
    const olderCommand = useAppCopyCommands({ ...commandInput, sourceText: 'A' });
    const newerCommand = useAppCopyCommands({ ...commandInput, sourceText: 'B' });
    const olderCopy = olderCommand.handleCopySource();
    const newerCopy = newerCommand.handleCopySource();
    await newerCopy;
    older.reject(new Error('旧复制失败'));
    await olderCopy;

    expect(clipboardMocks.copyText.mock.calls).toEqual([['A'], ['B']]);
    expect(toastMocks.showSuccess).toHaveBeenCalledOnce();
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('已复制源内容（1 字符 / 1 B）');
    expect.soft(toastMocks.showError).not.toHaveBeenCalled();
    expect.soft(commandInput.onTrackToolEvent).toHaveBeenCalledTimes(1);
    expect.soft(commandInput.onTrackToolEvent).toHaveBeenCalledWith(
      'SOURCE_COPY',
      'editor',
      'success',
      expect.any(Number),
    );
  });

  it('同步跳过请求也接管最新副作用', async () => {
    const older = createCopyDeferred();
    clipboardMocks.copyText.mockReturnValueOnce(older.promise);
    const olderCommand = useAppCopyCommands({ ...commandInput, sourceText: 'A' });
    const skippedCommand = useAppCopyCommands({ ...commandInput, sourceText: ' ' });
    const olderCopy = olderCommand.handleCopySource();
    await skippedCommand.handleCopySource();
    older.reject(new Error('旧复制失败'));
    await olderCopy;

    expect(clipboardMocks.copyText).toHaveBeenCalledOnce();
    expect(clipboardMocks.copyText).toHaveBeenCalledWith('A');
    expect(toastMocks.showError).toHaveBeenCalledOnce();
    expect(toastMocks.showError).toHaveBeenCalledWith('源内容为空，暂无可复制内容');
    expect(toastMocks.showSuccess).not.toHaveBeenCalled();
    expect(commandInput.onTrackToolEvent).toHaveBeenCalledOnce();
    expect(commandInput.onTrackToolEvent).toHaveBeenCalledWith(
      'SOURCE_COPY', 'editor', 'skipped', expect.any(Number),
    );
  });
});
