import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getSettingsBackupStorage,
  loadAppBackupModule,
  MAX_SETTINGS_BACKUP_FILE_SIZE_BYTES,
  readSettingsBackupFileText,
} from './appSettingsBackupBrowserEffects';

describe('appSettingsBackupBrowserAccess', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('读取导入文件文本并从当前窗口获取存储', async () => {
    const file = { text: vi.fn(async () => '{"ok":true}') };
    const storage = { getItem: vi.fn() } as unknown as Storage;
    vi.stubGlobal('window', { localStorage: storage });

    await expect(readSettingsBackupFileText(file)).resolves.toBe('{"ok":true}');
    expect(file.text).toHaveBeenCalledTimes(1);
    expect(getSettingsBackupStorage()).toBe(storage);
  });

  it('读取前拒绝超过 16 MiB 的备份文件并允许上限等值', async () => {
    const oversizedText = vi.fn(async () => '{"oversized":true}');
    const maximumText = vi.fn(async () => '{"maximum":true}');
    const oversizedFile = {
      size: MAX_SETTINGS_BACKUP_FILE_SIZE_BYTES + 1,
      text: oversizedText,
    };
    const maximumFile = {
      size: MAX_SETTINGS_BACKUP_FILE_SIZE_BYTES,
      text: maximumText,
    };

    await expect(readSettingsBackupFileText(oversizedFile)).rejects.toThrow(/文件过大.*16 MB/);
    expect(oversizedText).not.toHaveBeenCalled();

    await expect(readSettingsBackupFileText(maximumFile)).resolves.toBe('{"maximum":true}');
    expect(maximumText).toHaveBeenCalledTimes(1);
  });

  it('动态加载备份模块并暴露导出导入入口', async () => {
    const module = await loadAppBackupModule();

    expect(module.buildAppBackup).toEqual(expect.any(Function));
    expect(module.serializeAppBackup).toEqual(expect.any(Function));
    expect(module.applyAppBackupContent).toEqual(expect.any(Function));
    expect(module.notifyAppBackupImported).toEqual(expect.any(Function));
  });
});
