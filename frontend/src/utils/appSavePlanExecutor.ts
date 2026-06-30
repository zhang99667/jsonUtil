import type { AppSaveExecutablePlan } from './appSaveActionPlanTypes';
import type { AppSaveCommandEffects } from './appSaveCommandTypes';
import { runAppSavePlanEffect } from './appSavePlanEffectRunner';

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

  const success = await runAppSavePlanEffect({ plan, previewText, effects });
  if (success && 'successMessage' in plan) {
    effects.onShowSuccess(plan.successMessage);
  }
  return success;
};
