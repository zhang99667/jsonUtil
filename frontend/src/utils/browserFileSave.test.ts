import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  triggerBlobDownload,
  triggerTextDownload,
} from './browserFileSave';

const installDownloadStubs = ({
  append = vi.fn(),
  click = vi.fn(),
} = {}) => {
  const link = {
    href: '',
    download: '',
    click,
    remove: vi.fn(),
  };
  const createObjectURL = vi.fn(() => 'blob:download');
  const revokeObjectURL = vi.fn();

  vi.stubGlobal('document', {
    createElement: vi.fn(() => link),
    body: { appendChild: append },
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

});
