import { useCallback } from 'react';
import { ActionType } from '../types';
import {
  runAppPrimaryActionCommand,
  type AppPrimaryActionCommandEffects,
} from '../utils/appPrimaryActionCommandRunner';

interface UseAppPrimaryActionCommandInput extends Omit<AppPrimaryActionCommandEffects, 'now'> {
  now?: () => number;
}

const getCurrentPerformanceTime = () => performance.now();

export const useAppPrimaryActionCommand = ({
  onAiRepair,
  onToolbarSave,
  onOpenFile,
  onCreateNewTab,
  onTrackToolEvent,
  now = getCurrentPerformanceTime,
}: UseAppPrimaryActionCommandInput) => {
  const handleAction = useCallback((action: ActionType) => (
    runAppPrimaryActionCommand(action, {
      now,
      onAiRepair,
      onCreateNewTab,
      onOpenFile,
      onToolbarSave,
      onTrackToolEvent,
    })
  ), [
    now,
    onAiRepair,
    onCreateNewTab,
    onOpenFile,
    onToolbarSave,
    onTrackToolEvent,
  ]);

  return { handleAction };
};
