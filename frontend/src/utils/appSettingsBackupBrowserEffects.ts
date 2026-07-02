import type {
  AppSettingsBackupExportModule,
  AppSettingsBackupImportModule,
  AppSettingsBackupReadableFile,
  AppSettingsBackupTextFile,
} from './appSettingsBackupCommandRunnerTypes';

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
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
};
