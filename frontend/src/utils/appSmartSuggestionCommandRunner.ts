import { TransformMode } from '../types';
import type { SmartSuggestionActionId } from './smartInputSuggestion';
import { buildAppSmartSuggestionActionPlan } from './appSmartSuggestionActions';
import type { ToolEventStatus } from './productTelemetry';

type AppSmartSuggestionTrackEvent = (
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

interface AppSmartSuggestionCommandEffects {
  onRunAiFix: () => void;
  onSetMode: (mode: TransformMode) => void;
  onClearHighlight: () => void;
  onOpenSchemeInput: (value: string) => void;
  onSetSchemePanelOpen: (isOpen: boolean) => void;
  onSetTransformReportOpen: (isOpen: boolean) => void;
  onSetJsonTreePanelOpen: (isOpen: boolean) => void;
  onSetJsonSchemaPanelOpen: (isOpen: boolean) => void;
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

  if (plan.effects.includes('clear-highlight')) {
    effects.onClearHighlight();
  }
  if (plan.effects.includes('open-scheme-panel') && plan.schemeInputValue !== undefined) {
    effects.onOpenSchemeInput(plan.schemeInputValue);
  }
  if (plan.effects.includes('open-scheme-panel')) {
    effects.onSetSchemePanelOpen(true);
  }
  if (plan.effects.includes('close-transform-report')) {
    effects.onSetTransformReportOpen(false);
  }
  if (plan.effects.includes('open-json-tree-panel')) {
    effects.onSetJsonTreePanelOpen(true);
  }
  if (plan.effects.includes('open-json-schema-panel')) {
    effects.onSetJsonSchemaPanelOpen(true);
  }

  if (plan.successMessage) {
    effects.onShowSuccess(plan.successMessage);
  }
  effects.onTrackToolEvent(plan.eventName, 'smart_suggestion', 'success', startedAt);
};
