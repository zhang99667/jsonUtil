import type { TransformMode } from '../types';
import type { AppSmartSuggestionEffect } from './appSmartSuggestionActionConfig';

interface AppSmartSuggestionSchemePanelPlanInput {
  eventName: string;
  nextMode: TransformMode | null;
  sourceText: string;
}

interface AppSmartSuggestionSchemePanelPlan {
  eventName: string;
  status: 'success' | 'skipped';
  nextMode: TransformMode | null;
  effects: AppSmartSuggestionEffect[];
  schemeInputValue?: string;
  successMessage?: string;
  errorMessage?: string;
}

export const buildAppSmartSuggestionSchemePanelPlan = ({
  eventName,
  nextMode,
  sourceText,
}: AppSmartSuggestionSchemePanelPlanInput): AppSmartSuggestionSchemePanelPlan => {
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
};
