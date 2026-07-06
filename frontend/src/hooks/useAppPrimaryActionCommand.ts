import { useCallback, useMemo } from 'react';
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
  const primaryActionEffects = useMemo<AppPrimaryActionCommandEffects>(() => ({
    now, onAiRepair, onCreateNewTab, onOpenFile, onToolbarSave, onTrackToolEvent,
  }), [
    now,
    onAiRepair,
    onCreateNewTab,
    onOpenFile,
    onToolbarSave,
    onTrackToolEvent,
  ]);

  const handleAction = useCallback((action: ActionType) => (
    runAppPrimaryActionCommand(action, primaryActionEffects)
  ), [primaryActionEffects]);

  return { handleAction };
};
