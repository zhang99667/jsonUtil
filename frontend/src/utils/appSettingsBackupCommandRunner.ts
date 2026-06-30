import type { AIConfig, GeneralSettings, ShortcutConfig } from '../types';
import type { AppBackupPayload, ApplyAppBackupResult } from './appBackup';
import { getDetailedErrorMessage } from './errors';

interface AppSettingsBackupCommandInput {
  generalSettings: GeneralSettings;
  aiConfig: AIConfig;
  shortcuts: ShortcutConfig;
}

interface AppSettingsBackupExportModule {
  buildAppBackup: (input: AppSettingsBackupCommandInput) => AppBackupPayload;
  serializeAppBackup: (payload: AppBackupPayload) => string;
}

interface AppSettingsBackupImportModule {
  applyAppBackupContent: (
    content: string,
    storage: Storage,
    currentAIConfig: AIConfig,
  ) => ApplyAppBackupResult;
  notifyAppBackupImported: () => void;
}

export interface AppSettingsBackupTextFile {
  text: string;
  fileName: string;
  mimeType: string;
}

export interface AppSettingsBackupReadableFile {
  text: () => Promise<string>;
}

interface AppSettingsBackupExportEffects {
  onLoadBackupModule: () => Promise<AppSettingsBackupExportModule>;
  onDownloadTextFile: (file: AppSettingsBackupTextFile) => void;
  onShowSuccess: (message: string) => void;
  onShowError: (message: string) => void;
}

interface AppSettingsBackupImportEffects {
  onLoadBackupModule: () => Promise<AppSettingsBackupImportModule>;
  onReadFileText: (file: AppSettingsBackupReadableFile) => Promise<string>;
  onSetGeneralSettings: (settings: GeneralSettings) => void;
  onSetAIConfig: (config: AIConfig) => void;
  onReplaceShortcuts: (shortcuts: ShortcutConfig) => void;
  onShowSuccess: (message: string) => void;
  onShowError: (message: string) => void;
  storage: Storage;
}

export const buildAppSettingsBackupFileName = (exportedAt: string): string => {
  return `jsonutils-backup-${exportedAt.replace(/[:.]/g, '-')}.json`;
};

export const runAppExportSettingsBackupCommand = async (
  input: AppSettingsBackupCommandInput,
  effects: AppSettingsBackupExportEffects,
) => {
  try {
    const { buildAppBackup, serializeAppBackup } = await effects.onLoadBackupModule();
    const backup = buildAppBackup(input);

    effects.onDownloadTextFile({
      text: serializeAppBackup(backup),
      fileName: buildAppSettingsBackupFileName(backup.exportedAt),
      mimeType: 'application/json',
    });
    effects.onShowSuccess('配置备份已导出，未包含 AI Key');
  } catch (error) {
    effects.onShowError(getDetailedErrorMessage(error, '导出配置备份失败'));
  }
};

export const runAppImportSettingsBackupCommand = async (
  file: AppSettingsBackupReadableFile,
  currentAIConfig: AIConfig,
  effects: AppSettingsBackupImportEffects,
) => {
  try {
    const { applyAppBackupContent, notifyAppBackupImported } = await effects.onLoadBackupModule();
    const content = await effects.onReadFileText(file);
    const result = applyAppBackupContent(content, effects.storage, currentAIConfig);

    effects.onSetGeneralSettings(result.generalSettings);
    effects.onSetAIConfig(result.aiConfig);
    effects.onReplaceShortcuts(result.shortcuts);
    notifyAppBackupImported();
    effects.onShowSuccess('配置备份已导入，AI Key 已保留');
  } catch (error) {
    effects.onShowError(error instanceof Error ? error.message : '导入配置备份失败');
  }
};
