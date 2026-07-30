import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { triggerBlobDownload, triggerTextDownload } from './browserFileSave';

const installDownloadStubs = ({
  append = vi.fn(),
  click = vi.fn(),
  remove = vi.fn(),
  revokeObjectURL = vi.fn(),
} = {}) => {
  const link = {
    href: '',
    download: '',
    click,
    remove,
  };
  const createObjectURL = vi.fn(() => 'blob:download');
  vi.stubGlobal('document', {
    createElement: vi.fn(() => link),
    body: { appendChild: append },
    querySelector: vi.fn(() => null),
  });
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  return { append, createObjectURL, link, revokeObjectURL };
};

describe('browserFileSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('下载 Blob 时挂载并移除临时链接，下一任务回收 URL', () => {
    const stubs = installDownloadStubs();
    const blob = new Blob(['{}'], { type: 'application/json' });

    triggerBlobDownload(blob, 'result.json');

    expect(stubs.createObjectURL).toHaveBeenCalledWith(blob);
    expect(stubs.link.href).toBe('blob:download');
    expect(stubs.link.download).toBe('result.json');
    expect(stubs.append).toHaveBeenCalledWith(stubs.link);
    expect(stubs.link.click).toHaveBeenCalledTimes(1);
    expect(stubs.link.remove).toHaveBeenCalledTimes(1);
    expect(stubs.revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(stubs.revokeObjectURL).toHaveBeenCalledWith('blob:download');
  });

  it('原生对话框打开时把临时链接挂载到对话框内', () => {
    const stubs = installDownloadStubs();
    const dialog = { appendChild: vi.fn() };
    vi.mocked(document.querySelector).mockReturnValue(dialog as unknown as Element);
    triggerBlobDownload(new Blob(['{}']), 'result.json');
    expect(dialog.appendChild).toHaveBeenCalledWith(stubs.link);
    expect(stubs.append).not.toHaveBeenCalled();
  });

  it.each(['append', 'click'] as const)('%s 失败时仍移除链接并回收 URL', failureStage => {
    const error = new Error(`${failureStage} failed`);
    const stubs = installDownloadStubs({
      append: vi.fn(() => {
        if (failureStage === 'append') throw error;
      }),
      click: vi.fn(() => {
        if (failureStage === 'click') throw error;
      }),
    });

    expect(() => triggerTextDownload({
      text: '{}',
      fileName: 'result.json',
      mimeType: 'application/json',
    })).toThrow(error);

    expect(stubs.link.remove).toHaveBeenCalledTimes(1);
    vi.runAllTimers();
    expect(stubs.revokeObjectURL).toHaveBeenCalledWith('blob:download');
  });

  it('链接移除失败时不覆盖主流程异常且仍回收 URL', () => {
    const downloadError = new Error('点击失败');
    const cleanupError = new Error('移除失败');
    const stubs = installDownloadStubs({
      click: vi.fn(() => { throw downloadError; }),
      remove: vi.fn(() => { throw cleanupError; }),
    });

    expect(() => triggerTextDownload({
      text: '{}',
      fileName: 'result.json',
      mimeType: 'application/json',
    })).toThrow(downloadError);
    vi.runAllTimers();

    expect(stubs.revokeObjectURL).toHaveBeenCalledWith('blob:download');
    expect(console.warn).toHaveBeenCalledWith('移除临时下载链接失败:', cleanupError);
  });

  it('对象 URL 回收失败时只记录告警', () => {
    const cleanupError = new Error('回收失败');
    installDownloadStubs({
      revokeObjectURL: vi.fn(() => { throw cleanupError; }),
    });

    expect(() => triggerTextDownload({
      text: '{}',
      fileName: 'result.json',
      mimeType: 'application/json',
    })).not.toThrow();
    expect(() => vi.runAllTimers()).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith('回收临时下载地址失败:', cleanupError);
  });
});
