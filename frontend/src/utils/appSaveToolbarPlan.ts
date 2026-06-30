import type {
  AppSavePlanInput,
  AppToolbarSavePlan,
} from './appSaveActionPlanTypes';

export const buildAppToolbarSavePlan = ({
  activeEditor,
  hasActiveFile,
}: AppSavePlanInput): AppToolbarSavePlan => {
  if (activeEditor === 'PREVIEW') {
    return { action: 'save-preview-as' };
  }

  return hasActiveFile
    ? {
      action: 'save-source-to-file',
      successMessage: '已保存源文件',
    }
    : {
      action: 'save-source-as',
      successMessage: '已另存为源文件',
    };
};
