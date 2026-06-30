export const getActionPanelAiFixLabel = (isProcessing: boolean): string =>
  isProcessing ? '智能修复中，请等待当前任务完成' : '智能修复';

export const getActionPanelAiFixVisibleLabel = (isProcessing: boolean): string =>
  isProcessing ? '修复中...' : '智能修复';

const AI_FIX_BUTTON_CLASS_NAME = 'w-full bg-gradient-to-r from-violet-900/20 to-indigo-900/20 hover:from-violet-900/40 hover:to-indigo-900/40 border border-violet-500/20 hover:border-violet-500/40 text-violet-200 text-xs font-medium px-4 py-3 rounded-xl transition-all flex items-center gap-2 group justify-center active:scale-95 shadow-lg shadow-violet-900/5';

interface ActionPanelAiFixButtonState {
  ariaLabel: string;
  className: string;
  disabled: boolean;
  title: string;
  visibleLabel: string;
}

export const getActionPanelAiFixButtonState = (
  isProcessing: boolean,
  isCollapsed: boolean
): ActionPanelAiFixButtonState => {
  const label = getActionPanelAiFixLabel(isProcessing);

  return {
    ariaLabel: label,
    className: `${AI_FIX_BUTTON_CLASS_NAME} ${isCollapsed ? 'px-2' : ''}`,
    disabled: isProcessing,
    title: label,
    visibleLabel: getActionPanelAiFixVisibleLabel(isProcessing),
  };
};

export const getActionPanelFileButtonTitle = (
  label: string,
  isCollapsed: boolean
): string | undefined => (isCollapsed ? label : undefined);
