import { beforeEach, describe, expect, it, vi } from 'vitest';

const browserFileSaveMocks = vi.hoisted(() => ({
  triggerTextDownload: vi.fn(),
}));

vi.mock('./browserFileSave', () => browserFileSaveMocks);

import { downloadSettingsBackupTextFile } from './appSettingsBackupBrowserEffects';

describe('appSettingsBackupBrowserEffects', () => {
  beforeEach(() => {
    browserFileSaveMocks.triggerTextDownload.mockReset();
  });

  it('将备份文件参数交给公共文本下载工具', () => {
    const input = {
      text: '{"app":"jsonutils-pro"}',
      fileName: 'backup.json',
      mimeType: 'application/json',
    };

    downloadSettingsBackupTextFile(input);

    expect(browserFileSaveMocks.triggerTextDownload).toHaveBeenCalledWith(input);
  });

  it('保留公共下载工具抛出的异常', () => {
    const error = new Error('下载被阻止');
    browserFileSaveMocks.triggerTextDownload.mockImplementation(() => { throw error; });

    expect(() => downloadSettingsBackupTextFile({
      text: '{}',
      fileName: 'backup.json',
      mimeType: 'application/json',
    })).toThrow(error);
  });
});
