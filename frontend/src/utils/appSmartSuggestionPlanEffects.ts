import type {
  AppSmartSuggestionActionPlan,
  AppSmartSuggestionEffect,
} from './appSmartSuggestionActions';

export interface AppSmartSuggestionPlanEffectHandlers {
  onClearHighlight: () => void;
  onOpenSchemeInput: (value: string) => void;
  onSetSchemePanelOpen: (isOpen: boolean) => void;
  onSetTransformReportOpen: (isOpen: boolean) => void;
  onSetJsonTreePanelOpen: (isOpen: boolean) => void;
  onSetJsonSchemaPanelOpen: (isOpen: boolean) => void;
}

type PlanEffectRunner = (
  plan: AppSmartSuggestionActionPlan,
  effects: AppSmartSuggestionPlanEffectHandlers
) => void;

const SMART_SUGGESTION_EFFECT_ORDER: AppSmartSuggestionEffect[] = [
  'clear-highlight',
  'open-scheme-panel',
  'close-transform-report',
  'open-json-tree-panel',
  'open-json-schema-panel',
];

const PLAN_EFFECT_RUNNERS: Record<AppSmartSuggestionEffect, PlanEffectRunner> = {
  'clear-highlight': (_plan, effects) => effects.onClearHighlight(),
  'open-scheme-panel': (plan, effects) => {
    if (plan.schemeInputValue !== undefined) {
      effects.onOpenSchemeInput(plan.schemeInputValue);
    }
    effects.onSetSchemePanelOpen(true);
  },
  'close-transform-report': (_plan, effects) => effects.onSetTransformReportOpen(false),
  'open-json-tree-panel': (_plan, effects) => effects.onSetJsonTreePanelOpen(true),
  'open-json-schema-panel': (_plan, effects) => effects.onSetJsonSchemaPanelOpen(true),
};

export const runAppSmartSuggestionPlanEffects = (
  plan: AppSmartSuggestionActionPlan,
  effects: AppSmartSuggestionPlanEffectHandlers
) => {
  const plannedEffects = new Set(plan.effects);
  SMART_SUGGESTION_EFFECT_ORDER.forEach(effect => {
    if (plannedEffects.has(effect)) {
      PLAN_EFFECT_RUNNERS[effect](plan, effects);
    }
  });
};
