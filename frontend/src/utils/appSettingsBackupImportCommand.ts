import type { AIConfig } from '../types';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import type {
  AppSettingsBackupImportEffects,
  AppSettingsBackupReadableFile,
} from './appSettingsBackupCommandRunnerTypes';

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
    if (dispatchChunkLoadRecoveryEvent(error)) return;

    effects.onShowError(error instanceof Error ? error.message : '导入配置备份失败');
  }
};
