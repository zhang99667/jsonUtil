import { TransformMode } from '../types';
import {
  getSmartSuggestionMode,
  type SmartSuggestionActionId,
} from './smartInputSuggestion';
import {
  getAppSmartSuggestionStaticResult,
  type AppSmartSuggestionEffect,
} from './appSmartSuggestionActionConfig';

export type { AppSmartSuggestionEffect } from './appSmartSuggestionActionConfig';

export interface AppSmartSuggestionActionPlan {
  eventName: string;
  status: 'success' | 'skipped' | 'delegate-ai-fix';
  nextMode: TransformMode | null;
  effects: AppSmartSuggestionEffect[];
  schemeInputValue?: string;
  successMessage?: string;
  errorMessage?: string;
}

export interface AppSmartSuggestionActionPlanInput {
  actionId: SmartSuggestionActionId;
  currentMode: TransformMode;
  sourceText: string;
}

export const getSmartSuggestionEventName = (actionId: SmartSuggestionActionId): string => (
  `SMART_SUGGESTION_${actionId.toUpperCase().replace(/-/g, '_')}`
);

const getSuggestedMode = (
  actionId: SmartSuggestionActionId,
  currentMode: TransformMode
): TransformMode | null => {
  const suggestedMode = getSmartSuggestionMode(actionId);
  if (suggestedMode && currentMode !== suggestedMode) return suggestedMode;
  if (actionId === 'structure-nav' && currentMode !== TransformMode.DEEP_FORMAT) {
    return TransformMode.DEEP_FORMAT;
  }
  return null;
};

export const buildAppSmartSuggestionActionPlan = ({
  actionId,
  currentMode,
  sourceText,
}: AppSmartSuggestionActionPlanInput): AppSmartSuggestionActionPlan => {
  const eventName = getSmartSuggestionEventName(actionId);
  const nextMode = getSuggestedMode(actionId, currentMode);

  if (actionId === 'ai-fix') {
    return { eventName, status: 'delegate-ai-fix', nextMode: null, effects: [] };
  }

  if (actionId === 'scheme-panel') {
    const source = sourceText.trim();
    if (!source) {
      return {
        eventName,
        status: 'skipped',
        nextMode,
        effects: [],
        errorMessage: 'SOURCE 为空，暂无可解析内容',
      };
    }

    return {
      eventName,
      status: 'success',
      nextMode,
      effects: ['open-scheme-panel', 'close-transform-report'],
      schemeInputValue: source,
      successMessage: '已填入 Scheme 解析',
    };
  }

  const staticResult = getAppSmartSuggestionStaticResult(actionId);
  if (staticResult) return { eventName, status: 'success', nextMode, ...staticResult };

  return {
    eventName,
    status: 'success',
    nextMode,
    effects: [],
  };
};
