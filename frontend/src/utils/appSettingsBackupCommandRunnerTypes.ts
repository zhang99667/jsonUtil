import type { AIConfig, GeneralSettings, ShortcutConfig } from '../types';
import type { AppBackupPayload, ApplyAppBackupResult } from './appBackup';

export interface AppSettingsBackupCommandInput {
  generalSettings: GeneralSettings;
  aiConfig: AIConfig;
  shortcuts: ShortcutConfig;
}

export interface AppSettingsBackupExportModule {
  buildAppBackup: (input: AppSettingsBackupCommandInput & { storage: Storage }) => AppBackupPayload;
  serializeAppBackup: (payload: AppBackupPayload) => string;
}

export interface AppSettingsBackupImportModule {
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

export interface AppSettingsBackupExportEffects {
  onLoadBackupModule: () => Promise<AppSettingsBackupExportModule>;
  onGetStorage: () => Storage;
  onDownloadTextFile: (file: AppSettingsBackupTextFile) => void;
  onShowSuccess: (message: string) => void;
  onShowError: (message: string) => void;
}

export interface AppSettingsBackupImportEffects {
  onLoadBackupModule: () => Promise<AppSettingsBackupImportModule>;
  onReadFileText: (file: AppSettingsBackupReadableFile) => Promise<string>;
  onSetGeneralSettings: (settings: GeneralSettings) => void;
  onSetAIConfig: (config: AIConfig) => void;
  onReplaceShortcuts: (shortcuts: ShortcutConfig) => void;
  onShowSuccess: (message: string) => void;
  onShowError: (message: string) => void;
  onGetStorage: () => Storage;
}
