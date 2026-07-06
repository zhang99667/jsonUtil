import { runAppPanelLayoutResetCommand } from '../utils/appPanelLayoutResetCommandRunner';

export const useAppPanelLayoutResetCommand = () => ({
  handleResetPanelLayout: runAppPanelLayoutResetCommand,
});
