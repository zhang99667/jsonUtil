import { describe, expect, it, vi } from 'vitest';
import { createChunkLoadRecoveryHandlers } from './chunkLoadRecoveryEventHandlers';

const CHUNK_ERROR = new TypeError('Failed to fetch dynamically imported module: /assets/old.js');

const createEvent = (fields: Record<string, unknown> = {}) => ({
  preventDefault: vi.fn(),
  ...fields,
}) as unknown as Event & { preventDefault: ReturnType<typeof vi.fn> };

const createHandlers = () => {
  const promptRefreshOnce = vi.fn();
  return {
    handlers: createChunkLoadRecoveryHandlers(promptRefreshOnce),
    promptRefreshOnce,
  };
};

describe('chunkLoadRecoveryEventHandlers', () => {
  it('Vite preloadError 无 payload 时仍接管并提示刷新', () => {
    const { handlers, promptRefreshOnce } = createHandlers();
    const event = createEvent();

    handlers.handlePreloadError(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(promptRefreshOnce).toHaveBeenCalledTimes(1);
  });

  it('Promise rejection 只读取 reason 判断 chunk 失效', () => {
    const { handlers, promptRefreshOnce } = createHandlers();
    const businessEvent = createEvent({ reason: new Error('JSON 解析失败') });
    const chunkEvent = createEvent({ reason: CHUNK_ERROR });

    handlers.handleUnhandledRejection(businessEvent);
    handlers.handleUnhandledRejection(chunkEvent);

    expect(businessEvent.preventDefault).not.toHaveBeenCalled();
    expect(chunkEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(promptRefreshOnce).toHaveBeenCalledTimes(1);
  });

  it('全局 error 会回退读取资源 target URL', () => {
    const { handlers, promptRefreshOnce } = createHandlers();
    const imageEvent = createEvent({ target: { src: '/assets/logo-old.png' } });
    const chunkScriptEvent = createEvent({ target: { src: '/assets/main-old.js' } });

    handlers.handleGlobalError(imageEvent);
    handlers.handleGlobalError(chunkScriptEvent);

    expect(imageEvent.preventDefault).not.toHaveBeenCalled();
    expect(chunkScriptEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(promptRefreshOnce).toHaveBeenCalledTimes(1);
  });

  it('手动恢复事件兼容 payload 和 detail 两种载荷', () => {
    const { handlers, promptRefreshOnce } = createHandlers();
    const payloadEvent = createEvent({ payload: CHUNK_ERROR });
    const detailEvent = createEvent({ detail: CHUNK_ERROR });

    handlers.handleManualRecovery(payloadEvent);
    handlers.handleManualRecovery(detailEvent);

    expect(payloadEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(detailEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(promptRefreshOnce).toHaveBeenCalledTimes(2);
  });
});
