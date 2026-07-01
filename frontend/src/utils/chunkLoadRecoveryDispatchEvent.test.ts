import { describe, expect, it } from 'vitest';
import { CHUNK_LOAD_RECOVERY_EVENT } from './chunkLoadRecoveryEventTypes';
import { createChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatchEvent';

describe('createChunkLoadRecoveryEvent', () => {
  it('创建可取消的手动恢复事件并保留原始错误载荷', () => {
    const error = new TypeError('Failed to fetch dynamically imported module: /assets/old.js');

    const event = createChunkLoadRecoveryEvent(error);

    expect(event.type).toBe(CHUNK_LOAD_RECOVERY_EVENT);
    expect(event.cancelable).toBe(true);
    expect(event.payload).toBe(error);

    event.preventDefault();
    expect(event.defaultPrevented).toBe(true);
  });
});
