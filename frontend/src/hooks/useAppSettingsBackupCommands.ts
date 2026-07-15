import { useCallback } from 'react';
import type { AIConfig, GeneralSettings, ShortcutConfig } from '../types';
import {
  runAppExportSettingsBackupCommand,
  runAppImportSettingsBackupCommand,
} from '../utils/appSettingsBackupCommandRunner';
import {
  downloadSettingsBackupTextFile,
  getSettingsBackupStorage,
  loadAppBackupModule,
  readSettingsBackupFileText,
} from '../utils/appSettingsBackupBrowserEffects';
import { showError, showSuccess } from '../utils/toast';

interface UseAppSettingsBackupCommandsInput {
  generalSettings: GeneralSettings;
  aiConfig: AIConfig;
  shortcuts: ShortcutConfig;
  onSetGeneralSettings: (settings: GeneralSettings) => void;
  onSetAIConfig: (config: AIConfig) => void;
  onReplaceShortcuts: (shortcuts: ShortcutConfig) => void;
}

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
    onGetStorage: getSettingsBackupStorage,
    onDownloadTextFile: downloadSettingsBackupTextFile,
    onShowSuccess: showSuccess,
    onShowError: showError,
  }), [aiConfig, generalSettings, shortcuts]);

  const handleImportSettingsBackup = useCallback((file: File) => runAppImportSettingsBackupCommand(
    file,
    aiConfig,
    {
      onLoadBackupModule: loadAppBackupModule,
      onReadFileText: readSettingsBackupFileText,
      onSetGeneralSettings,
      onSetAIConfig,
      onReplaceShortcuts,
      onShowSuccess: showSuccess,
      onShowError: showError,
      onGetStorage: getSettingsBackupStorage,
    },
  ), [aiConfig, onReplaceShortcuts, onSetAIConfig, onSetGeneralSettings]);

  return { handleExportSettingsBackup, handleImportSettingsBackup };
};
