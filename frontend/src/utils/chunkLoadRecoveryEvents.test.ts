import { describe, expect, it, vi } from 'vitest';
import { CHUNK_LOAD_RECOVERY_EVENT } from './chunkLoadRecoveryEventTypes';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { installChunkLoadRecoveryListeners } from './chunkLoadRecoveryEvents';

type Listener = (event: Event) => void;

const createFakeTarget = () => {
  const listeners = new Map<string, Set<Listener>>();
  const getListeners = (type: string) => listeners.get(type) ?? new Set<Listener>();

  const target = {
    addEventListener: (type: string, listener: Listener) => {
      const typedListeners = getListeners(type);
      typedListeners.add(listener);
      listeners.set(type, typedListeners);
    },
    removeEventListener: (type: string, listener: Listener) => {
      getListeners(type).delete(listener);
    },
    dispatchEvent: (event: Event) => {
      for (const listener of getListeners(event.type)) {
        listener(event);
      }
      return !event.defaultPrevented;
    },
  };

  return {
    target,
    listenerCount: (type: string) => getListeners(type).size,
    emit: (type: string, event: Event) => {
      for (const listener of getListeners(type)) {
        listener(event);
      }
    },
  };
};

const createEvent = (fields: Record<string, unknown> = {}) => ({
  preventDefault: vi.fn(),
  ...fields,
}) as unknown as Event & { preventDefault: ReturnType<typeof vi.fn> };

describe('chunkLoadRecoveryEvents', () => {
  it('安装并清理 Vite preload、Promise rejection 与全局 error 监听', () => {
    const fakeTarget = createFakeTarget();

    const cleanup = installChunkLoadRecoveryListeners(fakeTarget.target, vi.fn());

    expect(fakeTarget.listenerCount('vite:preloadError')).toBe(1);
    expect(fakeTarget.listenerCount('unhandledrejection')).toBe(1);
    expect(fakeTarget.listenerCount('error')).toBe(1);
    expect(fakeTarget.listenerCount(CHUNK_LOAD_RECOVERY_EVENT)).toBe(1);

    cleanup();

    expect(fakeTarget.listenerCount('vite:preloadError')).toBe(0);
    expect(fakeTarget.listenerCount('unhandledrejection')).toBe(0);
    expect(fakeTarget.listenerCount('error')).toBe(0);
    expect(fakeTarget.listenerCount(CHUNK_LOAD_RECOVERY_EVENT)).toBe(0);
  });

  it('Vite preloadError 无 payload 时提示刷新并阻止默认错误传播', () => {
    const fakeTarget = createFakeTarget();
    const promptRefresh = vi.fn();
    installChunkLoadRecoveryListeners(fakeTarget.target, promptRefresh);
    const firstEvent = createEvent();
    const secondEvent = createEvent();

    fakeTarget.emit('vite:preloadError', firstEvent);
    fakeTarget.emit('vite:preloadError', secondEvent);

    expect(firstEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(secondEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(promptRefresh).toHaveBeenCalledTimes(1);
  });

  it('Promise rejection 只对动态 import 失败触发刷新提示', () => {
    const fakeTarget = createFakeTarget();
    const promptRefresh = vi.fn();
    installChunkLoadRecoveryListeners(fakeTarget.target, promptRefresh);
    const businessEvent = createEvent({ reason: new Error('JSON 解析失败') });
    const chunkEvent = createEvent({
      reason: new TypeError('Failed to fetch dynamically imported module: /assets/SchemeViewerModal-old.js'),
    });

    fakeTarget.emit('unhandledrejection', businessEvent);
    fakeTarget.emit('unhandledrejection', chunkEvent);

    expect(businessEvent.preventDefault).not.toHaveBeenCalled();
    expect(chunkEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(promptRefresh).toHaveBeenCalledTimes(1);
  });

  it('全局 error 命中动态 import 失败时触发刷新提示', () => {
    const fakeTarget = createFakeTarget();
    const promptRefresh = vi.fn();
    installChunkLoadRecoveryListeners(fakeTarget.target, promptRefresh);
    const businessEvent = createEvent({ message: 'ResizeObserver loop completed' });
    const chunkEvent = createEvent({
      error: new TypeError('Importing a module script failed.'),
    });
    const fallbackChunkEvent = createEvent({
      message: 'Failed to fetch dynamically imported module: /assets/SchemeViewerModal-old.js',
    });

    fakeTarget.emit('error', businessEvent);
    fakeTarget.emit('error', chunkEvent);
    fakeTarget.emit('error', fallbackChunkEvent);

    expect(businessEvent.preventDefault).not.toHaveBeenCalled();
    expect(chunkEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(fallbackChunkEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(promptRefresh).toHaveBeenCalledTimes(1);
  });

  it('全局资源加载事件只有 target URL 时也触发刷新提示', () => {
    const fakeTarget = createFakeTarget();
    const promptRefresh = vi.fn();
    installChunkLoadRecoveryListeners(fakeTarget.target, promptRefresh);
    const imageEvent = createEvent({
      target: { src: 'https://jsonutils.markz.fun/assets/logo-old.png' },
    });
    const chunkScriptEvent = createEvent({
      target: { src: 'https://jsonutils.markz.fun/assets/SchemeViewerModal-old.js' },
    });

    fakeTarget.emit('error', imageEvent);
    fakeTarget.emit('error', chunkScriptEvent);

    expect(imageEvent.preventDefault).not.toHaveBeenCalled();
    expect(chunkScriptEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(promptRefresh).toHaveBeenCalledTimes(1);
  });

  it('手动 catch 派发的 chunk 恢复事件会触发刷新提示', () => {
    const fakeTarget = createFakeTarget();
    const promptRefresh = vi.fn();
    installChunkLoadRecoveryListeners(fakeTarget.target, promptRefresh);

    const businessHandled = dispatchChunkLoadRecoveryEvent(new Error('JSON 解析失败'), fakeTarget.target);
    const chunkHandled = dispatchChunkLoadRecoveryEvent(
      new TypeError('Failed to fetch dynamically imported module: /assets/aiService-old.js'),
      fakeTarget.target
    );
    const duplicatedHandled = dispatchChunkLoadRecoveryEvent(
      new TypeError('Failed to fetch dynamically imported module: /assets/summary-old.js'),
      fakeTarget.target
    );

    expect(businessHandled).toBe(false);
    expect(chunkHandled).toBe(true);
    expect(duplicatedHandled).toBe(true);
    expect(promptRefresh).toHaveBeenCalledTimes(1);
  });
});
