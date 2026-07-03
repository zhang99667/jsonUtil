import { useCallback } from 'react';
import { notifyFloatingPanelLayoutReset, resetFloatingPanelLayoutStorage } from '../utils/panelLayout';
import { showSuccess } from '../utils/toast';

export const useAppPanelLayoutResetCommand = () => {
  const handleResetPanelLayout = useCallback(() => {
    resetFloatingPanelLayoutStorage();
    notifyFloatingPanelLayoutReset();
    showSuccess('浮动面板布局已恢复默认');
  }, []);

  return { handleResetPanelLayout };
};
