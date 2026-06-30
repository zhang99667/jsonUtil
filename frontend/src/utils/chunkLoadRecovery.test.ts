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

  it('不误判普通业务错误', () => {
    expect(isDynamicImportLoadError(new Error('JSON 解析失败'))).toBe(false);
    expect(isDynamicImportLoadError(null)).toBe(false);
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
});
