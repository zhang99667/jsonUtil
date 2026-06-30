import { useCallback } from 'react';
import type { AIConfig, GeneralSettings, ShortcutConfig } from '../types';
import {
  runAppExportSettingsBackupCommand,
  runAppImportSettingsBackupCommand,
  type AppSettingsBackupTextFile,
} from '../utils/appSettingsBackupCommandRunner';
import { showError, showSuccess } from '../utils/toast';

interface UseAppSettingsBackupCommandsInput {
  generalSettings: GeneralSettings;
  aiConfig: AIConfig;
  shortcuts: ShortcutConfig;
  onSetGeneralSettings: (settings: GeneralSettings) => void;
  onSetAIConfig: (config: AIConfig) => void;
  onReplaceShortcuts: (shortcuts: ShortcutConfig) => void;
}

const loadAppBackupModule = () => import('../utils/appBackup');

const downloadSettingsBackupTextFile = ({
  text,
  fileName,
  mimeType,
}: AppSettingsBackupTextFile) => {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const useAppSettingsBackupCommands = ({
  generalSettings,
  aiConfig,
  shortcuts,
  onSetGeneralSettings,
  onSetAIConfig,
  onReplaceShortcuts,
}: UseAppSettingsBackupCommandsInput) => {
  const handleExportSettingsBackup = useCallback(() => runAppExportSettingsBackupCommand({
    generalSettings,
    aiConfig,
    shortcuts,
  }, {
    onLoadBackupModule: loadAppBackupModule,
    onDownloadTextFile: downloadSettingsBackupTextFile,
    onShowSuccess: showSuccess,
    onShowError: showError,
  }), [aiConfig, generalSettings, shortcuts]);

  const handleImportSettingsBackup = useCallback((file: File) => runAppImportSettingsBackupCommand(
    file,
    aiConfig,
    {
      onLoadBackupModule: loadAppBackupModule,
      onReadFileText: (backupFile) => backupFile.text(),
      onSetGeneralSettings,
      onSetAIConfig,
      onReplaceShortcuts,
      onShowSuccess: showSuccess,
      onShowError: showError,
      storage: window.localStorage,
    },
  ), [aiConfig, onReplaceShortcuts, onSetAIConfig, onSetGeneralSettings]);

  return { handleExportSettingsBackup, handleImportSettingsBackup };
};
