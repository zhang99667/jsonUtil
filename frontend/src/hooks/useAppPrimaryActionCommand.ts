import { useCallback, useMemo } from 'react';
import { ActionType } from '../types';
import {
  runAppPrimaryActionCommand,
  type AppPrimaryActionCommandEffects,
} from '../utils/appPrimaryActionCommandRunner';

interface UseAppPrimaryActionCommandInput {
  onAiRepair: AppPrimaryActionCommandEffects['onAiRepair'];
  onToolbarSave: AppPrimaryActionCommandEffects['onToolbarSave'];
  onOpenFile: AppPrimaryActionCommandEffects['onOpenFile'];
  onCreateNewTab: () => void;
  onTrackToolEvent: AppPrimaryActionCommandEffects['onTrackToolEvent'];
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
  const effects = useMemo<AppPrimaryActionCommandEffects>(() => ({
    now,
    onAiRepair,
    onCreateNewTab,
    onOpenFile,
    onToolbarSave,
    onTrackToolEvent,
  }), [
    now,
    onAiRepair,
    onCreateNewTab,
    onOpenFile,
    onToolbarSave,
    onTrackToolEvent,
  ]);

  const handleAction = useCallback((action: ActionType) => (
    runAppPrimaryActionCommand(action, effects)
  ), [effects]);

  return { handleAction };
};
