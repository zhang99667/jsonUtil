import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText, getClipboardErrorMessage } from './clipboard';

describe('copyText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('优先使用 Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await copyText('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('Clipboard API 失败时回退到 textarea 复制', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const textarea = {
      value: '',
      style: {} as CSSStyleDeclaration,
      setAttribute: vi.fn(),
      focus: vi.fn(),
      select: vi.fn(),
      remove: vi.fn(),
    };
    const appendChild = vi.fn();
    const execCommand = vi.fn().mockReturnValue(true);

    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('document', {
      body: { appendChild },
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand,
    });

    await copyText('fallback');

    expect(textarea.value).toBe('fallback');
    expect(appendChild).toHaveBeenCalledWith(textarea);
    expect(textarea.select).toHaveBeenCalled();
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(textarea.remove).toHaveBeenCalled();
  });

  it('所有复制方式都不可用时抛出错误', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', {
      execCommand: vi.fn().mockReturnValue(false),
      body: { appendChild: vi.fn() },
      createElement: vi.fn().mockReturnValue({
        value: '',
        style: {},
        setAttribute: vi.fn(),
        focus: vi.fn(),
        select: vi.fn(),
        remove: vi.fn(),
      }),
    });

    await expect(copyText('blocked')).rejects.toThrow('浏览器拒绝复制操作');
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
