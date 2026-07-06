import type { AppTemplateFillCommandEffects } from './appTemplateFillCommandRunnerTypes';

export const abortTemplateFillIfSourceChanged = (
  sourceBeforeApply: string,
  effects: AppTemplateFillCommandEffects
): boolean => {
  if (effects.getCurrentSourceText() === sourceBeforeApply) return false;
  effects.onSetTemplateApplyQualityDelta('');
  effects.onShowError('内容已变化，请重新应用模板');
  return true;
};
