import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProvider, type AIConfig, type GeneralSettings } from '../types';
import type { AppBackupPayload, ApplyAppBackupResult } from './appBackup';
import { DEFAULT_SHORTCUTS } from './shortcuts';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import {
  buildAppSettingsBackupFileName,
  runAppExportSettingsBackupCommand,
  runAppImportSettingsBackupCommand,
} from './appSettingsBackupCommandRunner';
import { MemoryStorage } from './memoryStorageTestHelper';

vi.mock('./chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

const generalSettings: GeneralSettings = {
  autoExpandSchemeInDeepFormat: true,
};

const aiConfig: AIConfig = {
  provider: AIProvider.GEMINI,
  apiKey: 'current-key',
  model: 'gemini-2.0-flash',
};

const backupPayload = {
  exportedAt: '2026-06-29T12:34:56.789Z',
} as AppBackupPayload;

describe('appSettingsBackupCommandRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(false);
  });

  it('按导出时间构建安全的备份文件名', () => {
    expect(buildAppSettingsBackupFileName('2026-06-29T12:34:56.789Z'))
      .toBe('jsonutils-backup-2026-06-29T12-34-56-789Z.json');
  });

  it('导出配置备份时动态加载备份模块并下载文本文件', async () => {
    const storage = new MemoryStorage();
    const buildAppBackup = vi.fn(() => backupPayload);
    const serializeAppBackup = vi.fn(() => '{"app":"jsonutils-pro"}\n');
    const onDownloadTextFile = vi.fn();
    const onShowSuccess = vi.fn();
    const onShowError = vi.fn();

    await runAppExportSettingsBackupCommand({
      generalSettings,
      aiConfig,
      shortcuts: DEFAULT_SHORTCUTS,
    }, {
      onLoadBackupModule: async () => ({ buildAppBackup, serializeAppBackup }),
      onGetStorage: () => storage,
      onDownloadTextFile,
      onShowSuccess,
      onShowError,
    });

    expect(buildAppBackup).toHaveBeenCalledWith({
      generalSettings,
      aiConfig,
      shortcuts: DEFAULT_SHORTCUTS,
      storage,
    });
    expect(serializeAppBackup).toHaveBeenCalledWith(backupPayload);
    expect(onDownloadTextFile).toHaveBeenCalledWith({
      text: '{"app":"jsonutils-pro"}\n',
      fileName: 'jsonutils-backup-2026-06-29T12-34-56-789Z.json',
      mimeType: 'application/json',
    });
    expect(onShowSuccess).toHaveBeenCalledWith('配置备份下载已开始，未包含 AI Key');
    expect(onShowError).not.toHaveBeenCalled();
  });

  it('导出失败时展示可操作错误文案', async () => {
    const onShowError = vi.fn();

    await runAppExportSettingsBackupCommand({
      generalSettings,
      aiConfig,
      shortcuts: DEFAULT_SHORTCUTS,
    }, {
      onLoadBackupModule: async () => {
        throw new Error('模块加载失败');
      },
      onGetStorage: vi.fn(),
      onDownloadTextFile: vi.fn(),
      onShowSuccess: vi.fn(),
      onShowError,
    });

    expect(onShowError).toHaveBeenCalledWith('导出配置备份失败：模块加载失败');
  });

  it('导出模块 chunk 失效时交给统一刷新恢复', async () => {
    const onShowError = vi.fn();
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(true);
    const error = new TypeError('Failed to fetch dynamically imported module: /assets/appBackup-old.js');

    await runAppExportSettingsBackupCommand({
      generalSettings,
      aiConfig,
      shortcuts: DEFAULT_SHORTCUTS,
    }, {
      onLoadBackupModule: async () => {
        throw error;
      },
      onGetStorage: vi.fn(),
      onDownloadTextFile: vi.fn(),
      onShowSuccess: vi.fn(),
      onShowError,
    });

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(onShowError).not.toHaveBeenCalled();
  });

  it('浏览器拒绝访问本地存储时不导出不完整备份', async () => {
    const storageError = new Error('浏览器拒绝访问本地存储');
    const buildAppBackup = vi.fn(() => backupPayload);
    const serializeAppBackup = vi.fn(() => '{}');
    const onDownloadTextFile = vi.fn();
    const onShowSuccess = vi.fn();
    const onShowError = vi.fn();

    await runAppExportSettingsBackupCommand({
      generalSettings,
      aiConfig,
      shortcuts: DEFAULT_SHORTCUTS,
    }, {
      onLoadBackupModule: async () => ({ buildAppBackup, serializeAppBackup }),
      onGetStorage: () => {
        throw storageError;
      },
      onDownloadTextFile,
      onShowSuccess,
      onShowError,
    });

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(storageError);
    expect(onShowError).toHaveBeenCalledWith('导出配置备份失败：浏览器拒绝访问本地存储');
    expect(buildAppBackup).not.toHaveBeenCalled();
    expect(serializeAppBackup).not.toHaveBeenCalled();
    expect(onDownloadTextFile).not.toHaveBeenCalled();
    expect(onShowSuccess).not.toHaveBeenCalled();
  });

  it('导入配置备份后同步设置状态、快捷键和导入事件', async () => {
    const storage = new MemoryStorage();
    const file = { text: vi.fn(async () => '{"app":"jsonutils-pro"}') };
    const importedAIConfig: AIConfig = {
      ...aiConfig,
      model: 'imported-model',
    };
    const result: ApplyAppBackupResult = {
      generalSettings: { autoExpandSchemeInDeepFormat: false },
      aiConfig: importedAIConfig,
      shortcuts: DEFAULT_SHORTCUTS,
      importedCounts: {
        jsonPathHistory: 1,
        jsonPathFavorites: 1,
        structureSearchHistory: 1,
        jsonSchemaLibrary: 1,
        panelLayouts: 1,
        hasTemplate: true,
      },
    };
    const applyAppBackupContent = vi.fn(() => result);
    const notifyAppBackupImported = vi.fn();
    const onSetGeneralSettings = vi.fn();
    const onSetAIConfig = vi.fn();
    const onReplaceShortcuts = vi.fn();
    const onShowSuccess = vi.fn();

    await runAppImportSettingsBackupCommand(file, aiConfig, {
      onLoadBackupModule: async () => ({ applyAppBackupContent, notifyAppBackupImported }),
      onReadFileText: backupFile => backupFile.text(),
      onSetGeneralSettings,
      onSetAIConfig,
      onReplaceShortcuts,
      onShowSuccess,
      onShowError: vi.fn(),
      onGetStorage: () => storage,
    });

    expect(file.text).toHaveBeenCalledTimes(1);
    expect(applyAppBackupContent).toHaveBeenCalledWith('{"app":"jsonutils-pro"}', storage, aiConfig);
    expect(onSetGeneralSettings).toHaveBeenCalledWith(result.generalSettings);
    expect(onSetAIConfig).toHaveBeenCalledWith(importedAIConfig);
    expect(onReplaceShortcuts).toHaveBeenCalledWith(DEFAULT_SHORTCUTS);
    expect(notifyAppBackupImported).toHaveBeenCalledTimes(1);
    expect(onShowSuccess).toHaveBeenCalledWith('配置备份已导入，AI Key 已保留');
  });

  it('导入失败时沿用错误文案且不执行成功副作用', async () => {
    const onShowError = vi.fn();
    const notifyAppBackupImported = vi.fn();
    const onSetGeneralSettings = vi.fn();
    const onSetAIConfig = vi.fn();
    const onReplaceShortcuts = vi.fn();
    const onShowSuccess = vi.fn();

    await runAppImportSettingsBackupCommand({ text: async () => '{}' }, aiConfig, {
      onLoadBackupModule: async () => ({
        applyAppBackupContent: () => {
          throw new Error('备份文件不是 JSONUtils 配置备份');
        },
        notifyAppBackupImported,
      }),
      onReadFileText: backupFile => backupFile.text(),
      onSetGeneralSettings,
      onSetAIConfig,
      onReplaceShortcuts,
      onShowSuccess,
      onShowError,
      onGetStorage: () => new MemoryStorage(),
    });

    expect(onShowError).toHaveBeenCalledWith('备份文件不是 JSONUtils 配置备份');
    expect(notifyAppBackupImported).not.toHaveBeenCalled();
    expect(onSetGeneralSettings).not.toHaveBeenCalled();
    expect(onSetAIConfig).not.toHaveBeenCalled();
    expect(onReplaceShortcuts).not.toHaveBeenCalled();
    expect(onShowSuccess).not.toHaveBeenCalled();
  });

  it('导入模块 chunk 失效时不展示备份解析错误', async () => {
    const onShowError = vi.fn();
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(true);
    const error = new TypeError('Failed to fetch dynamically imported module: /assets/appBackup-old.js');

    await runAppImportSettingsBackupCommand({ text: async () => '{}' }, aiConfig, {
      onLoadBackupModule: async () => {
        throw error;
      },
      onReadFileText: backupFile => backupFile.text(),
      onSetGeneralSettings: vi.fn(),
      onSetAIConfig: vi.fn(),
      onReplaceShortcuts: vi.fn(),
      onShowSuccess: vi.fn(),
      onShowError,
      onGetStorage: () => new MemoryStorage(),
    });

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(onShowError).not.toHaveBeenCalled();
  });

  it('浏览器拒绝访问本地存储时在命令边界内展示错误', async () => {
    const applyAppBackupContent = vi.fn();
    const notifyAppBackupImported = vi.fn();
    const onSetGeneralSettings = vi.fn();
    const onSetAIConfig = vi.fn();
    const onReplaceShortcuts = vi.fn();
    const onShowSuccess = vi.fn();
    const onShowError = vi.fn();
    const storageError = new Error('浏览器拒绝访问本地存储');
    const onGetStorage = vi.fn(() => {
      throw storageError;
    });

    await expect(runAppImportSettingsBackupCommand({ text: async () => '{}' }, aiConfig, {
      onLoadBackupModule: async () => ({
        applyAppBackupContent,
        notifyAppBackupImported,
      }),
      onReadFileText: backupFile => backupFile.text(),
      onSetGeneralSettings,
      onSetAIConfig,
      onReplaceShortcuts,
      onShowSuccess,
      onShowError,
      onGetStorage,
    })).resolves.toBeUndefined();

    expect(onShowError).toHaveBeenCalledWith('浏览器拒绝访问本地存储');
    expect(onShowError).toHaveBeenCalledTimes(1);
    expect(onGetStorage).toHaveBeenCalledTimes(1);
    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(storageError);
    expect(applyAppBackupContent).not.toHaveBeenCalled();
    expect(notifyAppBackupImported).not.toHaveBeenCalled();
    expect(onSetGeneralSettings).not.toHaveBeenCalled();
    expect(onSetAIConfig).not.toHaveBeenCalled();
    expect(onReplaceShortcuts).not.toHaveBeenCalled();
    expect(onShowSuccess).not.toHaveBeenCalled();
  });
});
