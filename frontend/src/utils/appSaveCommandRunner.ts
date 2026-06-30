import type {
  AppSaveCommandEffects,
  AppSaveCommandInput,
  AppToolbarSaveCommandInput,
} from './appSaveCommandTypes';
import { buildAppSaveShortcutPlan } from './appSaveShortcutPlan';
import { buildAppToolbarSavePlan } from './appSaveToolbarPlan';
import { executeAppSavePlan } from './appSavePlanExecutor';

const trackAppSaveResult = (
  eventName: string,
  success: boolean,
  startedAt: number,
  effects: AppSaveCommandEffects,
) => {
  effects.onTrackToolEvent(eventName, 'file', success ? 'success' : 'skipped', startedAt);
};

export const runAppSaveShortcutCommand = async (
  input: AppSaveCommandInput,
  effects: AppSaveCommandEffects,
) => {
  const startedAt = effects.now?.() ?? performance.now();
  const plan = buildAppSaveShortcutPlan(input);
  const success = await executeAppSavePlan({ plan, previewText: input.previewText, effects });
  trackAppSaveResult('SAVE_SHORTCUT', success, startedAt, effects);
};

export const runAppToolbarSaveCommand = async (
  input: AppToolbarSaveCommandInput,
  effects: AppSaveCommandEffects,
) => {
  const startedAt = effects.now?.() ?? performance.now();
  const plan = buildAppToolbarSavePlan(input);
  const success = await executeAppSavePlan({ plan, previewText: '', effects });
  trackAppSaveResult('SAVE', success, startedAt, effects);
};
