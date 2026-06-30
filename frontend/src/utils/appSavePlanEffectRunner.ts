import type { AppSaveEffectPlan } from './appSaveActionPlanTypes';
import type { AppSaveCommandEffects } from './appSaveCommandTypes';

interface RunAppSavePlanEffectInput {
  plan: AppSaveEffectPlan;
  previewText: string;
  effects: AppSaveCommandEffects;
}

const assertNeverSavePlan = (plan: never): never => {
  throw new Error(`不支持的保存计划: ${JSON.stringify(plan)}`);
};

export const runAppSavePlanEffect = async ({
  plan,
  previewText,
  effects,
}: RunAppSavePlanEffectInput): Promise<boolean> => {
  switch (plan.action) {
    case 'save-preview-to-file':
      return effects.onSaveFile(previewText);
    case 'save-source-to-file':
      return effects.onSaveFile();
    case 'save-preview-as':
      return effects.onSavePreviewAs();
    case 'save-source-as':
      return effects.onSaveSourceAs();
    default:
      return assertNeverSavePlan(plan);
  }
};
