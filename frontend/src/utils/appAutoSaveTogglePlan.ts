export type AppAutoSaveTogglePlan =
  | {
    type: 'error';
    message: string;
  }
  | {
    type: 'toggle';
    nextEnabled: boolean;
    message: string;
  };

export interface AppAutoSaveTogglePlanInput {
  hasActiveFile: boolean;
  activeFileHasHandle: boolean;
  isAutoSaveEnabled: boolean;
}

export const buildAppAutoSaveTogglePlan = ({
  hasActiveFile,
  activeFileHasHandle,
  isAutoSaveEnabled,
}: AppAutoSaveTogglePlanInput): AppAutoSaveTogglePlan => {
  if (!hasActiveFile) {
    return {
      type: 'error',
      message: '请先打开或保存文件后再启用自动保存',
    };
  }

  if (!activeFileHasHandle) {
    return {
      type: 'error',
      message: '请先保存当前标签后再启用自动保存',
    };
  }

  const nextEnabled = !isAutoSaveEnabled;
  return {
    type: 'toggle',
    nextEnabled,
    message: nextEnabled ? '自动保存已开启' : '自动保存已关闭',
  };
};
