import { describe, expect, it } from 'vitest';
import {
  isDynamicImportLoadError,
  shouldPromptChunkLoadRecovery,
} from './chunkLoadRecovery';

describe('chunkLoadRecovery', () => {
  it('识别 Vite 动态 import 旧 chunk 失效错误', () => {
    expect(isDynamicImportLoadError(
      new TypeError('Failed to fetch dynamically imported module: https://jsonutils.markz.fun/assets/SchemeViewerModal-c9NWMJSm.js')
    )).toBe(true);
  });

  it('兼容不同浏览器和打包器的 chunk 加载失败文案', () => {
    expect(isDynamicImportLoadError(new Error('error loading dynamically imported module'))).toBe(true);
    expect(isDynamicImportLoadError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isDynamicImportLoadError(new Error('Unable to preload CSS for /assets/panel-old.css'))).toBe(true);
    expect(isDynamicImportLoadError(new Error('ChunkLoadError: Loading chunk 42 failed.'))).toBe(true);
  });

  it('识别被外层事件或 cause 包装的动态 import 错误', () => {
    expect(isDynamicImportLoadError({
      reason: new TypeError('Failed to fetch dynamically imported module: /assets/SchemeViewerModal-old.js'),
    })).toBe(true);
    expect(isDynamicImportLoadError({
      error: {
        cause: new Error('ChunkLoadError: Loading chunk scheme-viewer failed.'),
      },
    })).toBe(true);
    expect(isDynamicImportLoadError({
      detail: {
        payload: {
          errors: [new Error('Unable to preload CSS for /assets/panel-old.css')],
        },
      },
    })).toBe(true);
  });

  it('不误判普通业务错误', () => {
    expect(isDynamicImportLoadError(new Error('JSON 解析失败'))).toBe(false);
    expect(isDynamicImportLoadError(null)).toBe(false);
  });

  it('读取循环包装对象时不会误判或递归溢出', () => {
    const errorLike: { message: string; cause?: unknown } = { message: 'JSON 解析失败' };
    errorLike.cause = errorLike;

    expect(isDynamicImportLoadError(errorLike)).toBe(false);
  });

  it('八千层错误包装不耗尽调用栈', () => {
    const errorLike: { message: string; cause?: unknown } = {
      message: '顶层错误',
    };
    let current = errorLike;
    for (let depth = 0; depth < 8_000; depth += 1) {
      const cause = {
        message: depth === 7_999
          ? 'Failed to fetch dynamically imported module: /assets/panel-old.js'
          : `外层错误 ${depth}`,
      };
      current.cause = cause;
      current = cause;
    }

    expect(isDynamicImportLoadError(errorLike)).toBe(true);
  });

  it('超过遍历预算后停止读取后续错误', () => {
    const nodes: Array<{ cause?: unknown }> = Array.from({ length: 20_001 }, () => ({}));
    let readCount = 0;
    for (let index = 0; index < nodes.length - 1; index += 1) {
      Object.defineProperty(nodes[index], 'cause', {
        get: () => {
          readCount += 1;
          return nodes[index + 1];
        },
      });
    }

    expect(isDynamicImportLoadError(nodes[0])).toBe(false);
    expect(readCount).toBeLessThan(nodes.length - 1);
  });

  it('超宽子错误列表与深链共用遍历预算', () => {
    let readCount = 0;
    const errors = new Proxy(Array.from({ length: 20_000 }, () => ({ message: '普通错误' })), {
      get: (target, property, receiver) => {
        if (typeof property === 'string' && /^\d+$/.test(property)) readCount += 1;
        return Reflect.get(target, property, receiver);
      },
    });

    expect(isDynamicImportLoadError({ errors })).toBe(false);
    expect(readCount).toBeLessThan(errors.length);
  });

  it('抛错字段访问器不遮蔽其他可识别错误', () => {
    const errorLike = {
      reason: new Error('ChunkLoadError: Loading chunk settings failed.'),
    };
    Object.defineProperties(errorLike, {
      message: { get: () => { throw new Error('消息读取失败'); } },
      errors: { get: () => { throw new Error('错误列表读取失败'); } },
    });

    expect(isDynamicImportLoadError(errorLike)).toBe(true);
  });

  it('Vite preloadError 无 payload 时仍提示刷新', () => {
    expect(shouldPromptChunkLoadRecovery('vite-preload', undefined)).toBe(true);
  });

  it('Promise rejection 只对动态 import 失败提示刷新', () => {
    expect(shouldPromptChunkLoadRecovery(
      'promise-rejection',
      new TypeError('Failed to fetch dynamically imported module: /assets/SchemeViewerModal-old.js')
    )).toBe(true);
    expect(shouldPromptChunkLoadRecovery('promise-rejection', new Error('JSON 解析失败'))).toBe(false);
  });

  it('全局 error 只对动态 import 失败提示刷新', () => {
    expect(shouldPromptChunkLoadRecovery(
      'global-error',
      'Importing a module script failed.'
    )).toBe(true);
    expect(shouldPromptChunkLoadRecovery('global-error', 'ResizeObserver loop completed')).toBe(false);
  });

  it('手动 catch 只对动态 import 失败提示刷新', () => {
    expect(shouldPromptChunkLoadRecovery(
      'manual-catch',
      new TypeError('Failed to fetch dynamically imported module: /assets/aiService-old.js')
    )).toBe(true);
    expect(shouldPromptChunkLoadRecovery('manual-catch', new Error('AI Key 无效'))).toBe(false);
  });
});
