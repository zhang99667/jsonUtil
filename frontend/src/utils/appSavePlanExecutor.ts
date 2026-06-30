import type {
  AppSaveShortcutPlan,
  AppToolbarSavePlan,
} from './appSaveActionPlanTypes';
import type { AppSaveCommandEffects } from './appSaveCommandTypes';

type AppSaveExecutablePlan = AppSaveShortcutPlan | AppToolbarSavePlan;

interface ExecuteAppSavePlanInput {
  plan: AppSaveExecutablePlan;
  previewText: string;
  effects: AppSaveCommandEffects;
}

export const executeAppSavePlan = async ({
  plan,
  previewText,
  effects,
}: ExecuteAppSavePlanInput): Promise<boolean> => {
  if (plan.action === 'skip') {
    if ('message' in plan) effects.onShowError(plan.message);
    return false;
  }

  let success = false;
  if (plan.action === 'save-preview-to-file') {
    success = await effects.onSaveFile(previewText);
  } else if (plan.action === 'save-source-to-file') {
    success = await effects.onSaveFile();
  } else if (plan.action === 'save-preview-as') {
    success = await effects.onSavePreviewAs();
  } else {
    success = await effects.onSaveSourceAs();
  }

  if (success && 'successMessage' in plan) {
    effects.onShowSuccess(plan.successMessage);
  }
  return success;
};
