import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDurationBucket, getTextSizeBucket, trackToolEvent } from '../utils/productTelemetry';
import { useAppToolTelemetry } from './useAppToolTelemetry';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/productTelemetry', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/productTelemetry')>(),
  getDurationBucket: vi.fn(() => 'duration-bucket'),
  getTextSizeBucket: vi.fn(() => 'size-bucket'),
  trackToolEvent: vi.fn(),
}));

describe('useAppToolTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('按当前 SOURCE 文本和默认成功状态发送工具事件', () => {
    const inputRef = { current: '{"a":1}' };
    const trackTool = useAppToolTelemetry({ inputRef, now: () => 1000 });

    trackTool('FORMAT', 'transform_mode');

    expect(getTextSizeBucket).toHaveBeenCalledWith('{"a":1}');
    expect(getDurationBucket).toHaveBeenCalledWith(0);
    expect(trackToolEvent).toHaveBeenCalledWith({
      eventName: 'FORMAT',
      category: 'transform_mode',
      status: 'success',
      inputSizeBucket: 'size-bucket',
      durationBucket: 'duration-bucket',
    });
  });

  it('按 startedAt 计算耗时并透传非成功状态', () => {
    const inputRef = { current: 'first' };
    const trackTool = useAppToolTelemetry({ inputRef, now: () => 1123 });
    inputRef.current = 'latest';

    trackTool('AI_FIX', 'ai', 'error', 1000);

    expect(getTextSizeBucket).toHaveBeenCalledWith('latest');
    expect(getDurationBucket).toHaveBeenCalledWith(123);
    expect(trackToolEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'AI_FIX',
      category: 'ai',
      status: 'error',
    }));
  });
});
