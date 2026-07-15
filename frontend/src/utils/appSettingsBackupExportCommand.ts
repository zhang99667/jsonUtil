import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { getDetailedErrorMessage } from './errors';
import type {
  AppSettingsBackupCommandInput,
  AppSettingsBackupExportEffects,
} from './appSettingsBackupCommandRunnerTypes';

export const buildAppSettingsBackupFileName = (exportedAt: string): string => {
  return `jsonutils-backup-${exportedAt.replace(/[:.]/g, '-')}.json`;
};

export const runAppExportSettingsBackupCommand = async (
  input: AppSettingsBackupCommandInput,
  effects: AppSettingsBackupExportEffects,
) => {
  try {
    const { buildAppBackup, serializeAppBackup } = await effects.onLoadBackupModule();
    const backup = buildAppBackup({ ...input, storage: effects.onGetStorage() });

    effects.onDownloadTextFile({
      text: serializeAppBackup(backup),
      fileName: buildAppSettingsBackupFileName(backup.exportedAt),
      mimeType: 'application/json',
    });
    effects.onShowSuccess('配置备份下载已开始，未包含 AI Key');
  } catch (error) {
    if (dispatchChunkLoadRecoveryEvent(error)) return;

    effects.onShowError(getDetailedErrorMessage(error, '导出配置备份失败'));
  }
};
