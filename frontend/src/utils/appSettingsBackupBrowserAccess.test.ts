import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getSettingsBackupStorage,
  loadAppBackupModule,
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

  it('动态加载备份模块并暴露导出导入入口', async () => {
    const module = await loadAppBackupModule();

    expect(module.buildAppBackup).toEqual(expect.any(Function));
    expect(module.serializeAppBackup).toEqual(expect.any(Function));
    expect(module.applyAppBackupContent).toEqual(expect.any(Function));
    expect(module.notifyAppBackupImported).toEqual(expect.any(Function));
  });
});
