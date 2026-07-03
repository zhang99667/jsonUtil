import { TransformMode } from '../types';
import type { SmartSuggestionActionId } from './smartInputSuggestion';
import { buildAppSmartSuggestionActionPlan } from './appSmartSuggestionActions';
import {
  runAppSmartSuggestionPlanEffects,
  type AppSmartSuggestionPlanEffectHandlers,
} from './appSmartSuggestionPlanEffects';
import type { ToolEventStatus } from './productTelemetry';

export type AppSmartSuggestionTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

interface AppSmartSuggestionCommandInput {
  actionId: SmartSuggestionActionId;
  currentMode: TransformMode;
  sourceText: string;
}

export interface AppSmartSuggestionCommandEffects extends AppSmartSuggestionPlanEffectHandlers {
  onRunAiFix: () => void;
  onSetMode: (mode: TransformMode) => void;
  onShowError: (message: string) => void;
  onShowSuccess: (message: string) => void;
  onTrackToolEvent: AppSmartSuggestionTrackEvent;
  now?: () => number;
}

export const runAppSmartSuggestionCommand = (
  input: AppSmartSuggestionCommandInput,
  effects: AppSmartSuggestionCommandEffects,
) => {
  const startedAt = effects.now?.() ?? performance.now();
  const plan = buildAppSmartSuggestionActionPlan(input);

  if (plan.status === 'delegate-ai-fix') {
    effects.onRunAiFix();
    return;
  }

  if (plan.nextMode) {
    effects.onSetMode(plan.nextMode);
  }

  if (plan.status === 'skipped') {
    effects.onShowError(plan.errorMessage || '当前智能建议暂不可用');
    effects.onTrackToolEvent(plan.eventName, 'smart_suggestion', 'skipped', startedAt);
    return;
  }

  runAppSmartSuggestionPlanEffects(plan, effects);
  if (plan.successMessage) {
    effects.onShowSuccess(plan.successMessage);
  }
  effects.onTrackToolEvent(plan.eventName, 'smart_suggestion', 'success', startedAt);
};
