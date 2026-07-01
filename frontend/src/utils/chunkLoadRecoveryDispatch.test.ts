import { describe, expect, it, vi } from 'vitest';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';

const createChunkError = () => (
  new TypeError('Failed to fetch dynamically imported module: /assets/old.js')
);

describe('dispatchChunkLoadRecoveryEvent', () => {
  it('无浏览器派发目标时不接管 chunk 加载错误', () => {
    expect(dispatchChunkLoadRecoveryEvent(createChunkError(), undefined)).toBe(false);
  });

  it('派发目标直接取消事件时返回已接管', () => {
    const target = {
      dispatchEvent: vi.fn(() => false),
    };

    expect(dispatchChunkLoadRecoveryEvent(createChunkError(), target)).toBe(true);
    expect(target.dispatchEvent).toHaveBeenCalledTimes(1);
  });
});
