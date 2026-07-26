import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText, getClipboardErrorMessage, readClipboardText } from './clipboard';

const clipboardMocks = vi.hoisted(() => ({
  copyToClipboard: vi.fn(),
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

vi.mock('copy-to-clipboard', () => ({ default: clipboardMocks.copyToClipboard }));
vi.mock('./chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: clipboardMocks.dispatchChunkLoadRecoveryEvent,
}));

describe('copyText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    clipboardMocks.dispatchChunkLoadRecoveryEvent.mockReturnValue(false);
  });

  it('委托成熟剪贴板工具完成复制', async () => {
    clipboardMocks.copyToClipboard.mockResolvedValue(true);
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {});

    await copyText('hello');

    expect(clipboardMocks.copyToClipboard).toHaveBeenCalledWith('hello');
  });

  it('所有复制路径失败时抛出稳定错误', async () => {
    clipboardMocks.copyToClipboard.mockResolvedValue(false);
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {});

    await expect(copyText('blocked')).rejects.toThrow('浏览器拒绝复制操作');
  });

  it('旧 chunk 失效时请求统一刷新恢复', async () => {
    const chunkError = new Error('Failed to fetch dynamically imported module');
    clipboardMocks.copyToClipboard.mockRejectedValue(chunkError);
    clipboardMocks.dispatchChunkLoadRecoveryEvent.mockReturnValue(true);
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {});

    await expect(copyText('待复制内容')).rejects.toThrow('复制能力加载失败，请刷新页面后重试');

    expect(clipboardMocks.dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(chunkError);
  });

  it('非浏览器环境不加载剪贴板工具', async () => {
    await expect(copyText('blocked')).rejects.toThrow('当前环境不支持剪贴板复制');
    expect(clipboardMocks.copyToClipboard).not.toHaveBeenCalled();
  });
});

describe('readClipboardText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('通过 Clipboard API 读取文本', async () => {
    const readText = vi.fn().mockResolvedValue('hello');
    vi.stubGlobal('navigator', { clipboard: { readText } });

    await expect(readClipboardText()).resolves.toBe('hello');
    expect(readText).toHaveBeenCalled();
  });

  it('读取能力不可用时抛出明确错误', async () => {
    vi.stubGlobal('navigator', {});

    await expect(readClipboardText()).rejects.toThrow('当前环境不支持读取剪贴板');
  });

  it('浏览器拒绝读取时抛出明确错误', async () => {
    const readText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { readText } });

    await expect(readClipboardText()).rejects.toThrow('浏览器拒绝读取剪贴板');
  });
});

describe('getClipboardErrorMessage', () => {
  it('优先展示底层复制失败原因', () => {
    expect(getClipboardErrorMessage(new Error('浏览器拒绝复制操作'))).toBe('浏览器拒绝复制操作');
  });

  it('非 Error 错误使用兜底文案', () => {
    expect(getClipboardErrorMessage('blocked', '复制查询结果失败')).toBe('复制查询结果失败');
  });
});
