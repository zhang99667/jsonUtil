import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fileSaveMocks = vi.hoisted(() => ({
  triggerTextDownload: vi.fn(),
  writeTextToFileHandleQueued: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('./browserFileHandleWrite', () => ({
  writeTextToFileHandleQueued: fileSaveMocks.writeTextToFileHandleQueued,
}));
vi.mock('./browserFileSave', () => ({
  triggerTextDownload: fileSaveMocks.triggerTextDownload,
}));
vi.mock('./toast', () => toastMocks);

import { savePreviewTextAsJsonFile } from './previewSaveFile';

describe('savePreviewTextAsJsonFile', () => {
  beforeEach(() => {
    fileSaveMocks.triggerTextDownload.mockReset();
    fileSaveMocks.writeTextToFileHandleQueued.mockReset().mockResolvedValue(undefined);
    toastMocks.showError.mockReset();
    toastMocks.showSuccess.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('预览仍在处理时拒绝保存', async () => {
    await expect(savePreviewTextAsJsonFile({
      previewText: '{}',
      isOutputTransforming: true,
    })).resolves.toBe(false);

    expect(toastMocks.showError).toHaveBeenCalledWith('预览仍在处理，请稍后再保存');
    expect(fileSaveMocks.writeTextToFileHandleQueued).not.toHaveBeenCalled();
  });

  it('用户取消文件选择时保持静默', async () => {
    vi.stubGlobal('window', {
      showSaveFilePicker: vi.fn().mockRejectedValue(new DOMException('用户取消', 'AbortError')),
    });

    await expect(savePreviewTextAsJsonFile({
      previewText: '{}',
      isOutputTransforming: false,
    })).resolves.toBe(false);

    expect(toastMocks.showError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('写入阶段的 AbortError 仍作为真实失败反馈', async () => {
    const handle = { name: 'preview.json' } as FileSystemFileHandle;
    const error = new DOMException('磁盘写入失败', 'AbortError');
    vi.stubGlobal('window', {
      showSaveFilePicker: vi.fn().mockResolvedValue(handle),
    });
    fileSaveMocks.writeTextToFileHandleQueued.mockRejectedValue(error);

    await expect(savePreviewTextAsJsonFile({
      previewText: '{"preview":true}',
      isOutputTransforming: false,
    })).resolves.toBe(false);

    expect(fileSaveMocks.writeTextToFileHandleQueued).toHaveBeenCalledWith(handle, '{"preview":true}');
    expect(toastMocks.showError).toHaveBeenCalledWith('保存预览结果失败：磁盘写入失败');
    expect(console.error).toHaveBeenCalledWith('保存预览结果失败:', error);
  });

  it('保存选择器不可用时发起下载并使用准确提示', async () => {
    vi.stubGlobal('window', { showSaveFilePicker: {} });

    await expect(savePreviewTextAsJsonFile({
      previewText: '{"preview":true}',
      isOutputTransforming: false,
    })).resolves.toBe(true);

    expect(fileSaveMocks.triggerTextDownload).toHaveBeenCalledWith({
      text: '{"preview":true}',
      fileName: 'preview_result.json',
      mimeType: 'application/json',
    });
    expect(toastMocks.showSuccess).toHaveBeenCalledWith('已开始下载预览结果');
  });
});
