import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadSettingsBackupTextFile,
  getSettingsBackupStorage,
  readSettingsBackupFileText,
} from './appSettingsBackupBrowserEffects';

const installDownloadDomStubs = (click = vi.fn()) => {
  const link = {
    href: '',
    download: '',
    click,
    remove: vi.fn(),
  };
  const createElement = vi.fn(() => link);
  const appendChild = vi.fn();
  const createObjectURL = vi.fn(() => 'blob:settings-backup');
  const revokeObjectURL = vi.fn();

  vi.stubGlobal('document', {
    createElement,
    body: { appendChild },
  });
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

  return { appendChild, createElement, createObjectURL, link, revokeObjectURL };
};

describe('appSettingsBackupBrowserEffects', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('下载备份文本时创建临时链接并释放 Blob URL', () => {
    const stubs = installDownloadDomStubs();

    downloadSettingsBackupTextFile({
      text: '{"app":"jsonutils-pro"}',
      fileName: 'backup.json',
      mimeType: 'application/json',
    });

    expect(stubs.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(stubs.createElement).toHaveBeenCalledWith('a');
    expect(stubs.link.href).toBe('blob:settings-backup');
    expect(stubs.link.download).toBe('backup.json');
    expect(stubs.appendChild).toHaveBeenCalledWith(stubs.link);
    expect(stubs.link.click).toHaveBeenCalledTimes(1);
    expect(stubs.link.remove).toHaveBeenCalledTimes(1);
    expect(stubs.revokeObjectURL).toHaveBeenCalledWith('blob:settings-backup');
  });

  it('触发下载失败时仍清理临时链接和 Blob URL', () => {
    const error = new Error('download blocked');
    const stubs = installDownloadDomStubs(vi.fn(() => {
      throw error;
    }));

    expect(() => downloadSettingsBackupTextFile({
      text: '{}',
      fileName: 'backup.json',
      mimeType: 'application/json',
    })).toThrow(error);

    expect(stubs.link.remove).toHaveBeenCalledTimes(1);
    expect(stubs.revokeObjectURL).toHaveBeenCalledWith('blob:settings-backup');
  });

  it('读取导入文件文本并从当前窗口获取存储', async () => {
    const file = { text: vi.fn(async () => '{"ok":true}') };
    const storage = { getItem: vi.fn() } as unknown as Storage;
    vi.stubGlobal('window', { localStorage: storage });

    await expect(readSettingsBackupFileText(file)).resolves.toBe('{"ok":true}');
    expect(file.text).toHaveBeenCalledTimes(1);
    expect(getSettingsBackupStorage()).toBe(storage);
  });
});
