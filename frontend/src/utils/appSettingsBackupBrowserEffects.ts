import type {
  AppSettingsBackupExportModule,
  AppSettingsBackupImportModule,
  AppSettingsBackupReadableFile,
  AppSettingsBackupTextFile,
} from './appSettingsBackupCommandRunnerTypes';
import { triggerTextDownload } from './browserFileSave';

type AppSettingsBackupModule = AppSettingsBackupExportModule & AppSettingsBackupImportModule;

export const loadAppBackupModule = async (): Promise<AppSettingsBackupModule> => import('./appBackup');

export const readSettingsBackupFileText = (backupFile: AppSettingsBackupReadableFile): Promise<string> => {
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
