import type {
  AppSettingsBackupExportModule,
  AppSettingsBackupImportModule,
  AppSettingsBackupReadableFile,
  AppSettingsBackupTextFile,
} from './appSettingsBackupCommandRunnerTypes';
import { triggerTextDownload } from './browserFileSave';
import { formatFileSize } from './fileGuards';

type AppSettingsBackupModule = AppSettingsBackupExportModule & AppSettingsBackupImportModule;

export const MAX_SETTINGS_BACKUP_FILE_SIZE_BYTES = 16 * 1024 * 1024;

export const loadAppBackupModule = async (): Promise<AppSettingsBackupModule> => import('./appBackup');

export const readSettingsBackupFileText = (backupFile: AppSettingsBackupReadableFile): Promise<string> => {
  if (
    'size' in backupFile &&
    typeof backupFile.size === 'number' &&
    backupFile.size > MAX_SETTINGS_BACKUP_FILE_SIZE_BYTES
  ) {
    return Promise.reject(new Error(
      `配置备份文件过大，请选择不超过 ${formatFileSize(MAX_SETTINGS_BACKUP_FILE_SIZE_BYTES)} 的文件。`
    ));
  }

  return backupFile.text();
};

export const getSettingsBackupStorage = (): Storage => window.localStorage;

export const downloadSettingsBackupTextFile = ({
  text,
  fileName,
  mimeType,
}: AppSettingsBackupTextFile): void => {
  triggerTextDownload({ text, fileName, mimeType });
};
