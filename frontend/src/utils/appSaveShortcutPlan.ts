import type {
  AppSavePlanInput,
  AppSaveShortcutPlan,
} from './appSaveActionPlanTypes';

export const buildAppSaveShortcutPlan = ({
  activeEditor,
  hasActiveFile,
  activeFileHasHandle = false,
  isOutputTransforming = false,
}: AppSavePlanInput): AppSaveShortcutPlan => {
  if (activeEditor === 'PREVIEW' && isOutputTransforming) {
    return {
      action: 'skip',
      reason: 'preview-transforming',
      message: '预览仍在处理，请稍后再保存',
    };
  }

  if (activeEditor === 'PREVIEW' && hasActiveFile && !activeFileHasHandle) {
    return { action: 'skip', reason: 'preview-active-file-without-handle' };
  }

  if (hasActiveFile) {
    return activeEditor === 'PREVIEW'
      ? {
        action: 'save-preview-to-file',
        successMessage: '已将 PREVIEW 内容保存到文件',
      }
      : {
        action: 'save-source-to-file',
        successMessage: '已将 SOURCE 内容保存到文件',
      };
  }

  return activeEditor === 'PREVIEW'
    ? { action: 'save-preview-as' }
    : {
      action: 'save-source-as',
      successMessage: '已另存为源文件',
    };
};
