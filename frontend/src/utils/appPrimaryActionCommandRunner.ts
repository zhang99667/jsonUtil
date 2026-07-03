import { ActionType } from '../types';
import type { ToolEventStatus } from './productTelemetry';

type AsyncCommand = () => Promise<unknown>;
type TrackToolEvent = (eventName: string, category: string, status?: ToolEventStatus, startedAt?: number) => void;

export interface AppPrimaryActionCommandEffects {
  onAiRepair: AsyncCommand;
  onToolbarSave: AsyncCommand;
  onOpenFile: AsyncCommand;
  onCreateNewTab: () => void;
  onTrackToolEvent: TrackToolEvent;
  now: () => number;
}

const trackFileAction = (
  action: ActionType.OPEN | ActionType.NEW_TAB,
  startedAt: number,
  effects: AppPrimaryActionCommandEffects,
) => {
  effects.onTrackToolEvent(action, 'file', 'success', startedAt);
};

export const runAppPrimaryActionCommand = async (
  action: ActionType,
  effects: AppPrimaryActionCommandEffects,
): Promise<void> => {
  if (action === ActionType.AI_FIX) {
    await effects.onAiRepair();
    return;
  }

  if (action === ActionType.SAVE) {
    await effects.onToolbarSave();
    return;
  }

  const startedAt = effects.now();
  if (action === ActionType.OPEN) {
    await effects.onOpenFile();
    trackFileAction(action, startedAt, effects);
  } else if (action === ActionType.NEW_TAB) {
    effects.onCreateNewTab();
    trackFileAction(action, startedAt, effects);
  }
};
