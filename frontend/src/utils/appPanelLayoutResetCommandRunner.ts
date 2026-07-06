import { notifyFloatingPanelLayoutReset, resetFloatingPanelLayoutStorage } from './panelLayout';
import { showSuccess } from './toast';

export const runAppPanelLayoutResetCommand = () => {
  resetFloatingPanelLayoutStorage();
  notifyFloatingPanelLayoutReset();
  showSuccess('浮动面板布局已恢复默认');
};
