import { notifyFloatingPanelLayoutReset, resetFloatingPanelLayoutStorage } from './panelLayout';
import { showSettingsDialogSuccess } from './toast';

export const runAppPanelLayoutResetCommand = () => {
  resetFloatingPanelLayoutStorage();
  notifyFloatingPanelLayoutReset();
  showSettingsDialogSuccess('浮动面板布局已恢复默认');
};
