import { useCallback } from 'react';
import { runAppPanelLayoutResetCommand } from '../utils/appPanelLayoutResetCommandRunner';

export const useAppPanelLayoutResetCommand = () => {
  const handleResetPanelLayout = useCallback(() => {
    runAppPanelLayoutResetCommand();
  }, []);

  return { handleResetPanelLayout };
};
