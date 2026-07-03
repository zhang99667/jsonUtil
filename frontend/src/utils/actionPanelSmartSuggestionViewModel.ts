import {
  getActionPanelSmartSuggestionOriginLabel,
  getActionPanelSmartSuggestionToneClassName,
  getVisibleActionPanelSmartSuggestionActions,
} from './actionPanelSmartSuggestionState';
import type { SmartInputSuggestion, SmartSuggestionAction } from './smartInputSuggestion';

export interface ActionPanelSmartSuggestionViewModel {
  primaryAction: SmartSuggestionAction;
  originLabel: string;
  toneClassName: string;
  collapsedAriaLabel: string;
  collapsedTitle: string;
  visibleActions: SmartSuggestionAction[];
}

export const buildActionPanelSmartSuggestionViewModel = (
  smartSuggestion: SmartInputSuggestion | null,
  smartSuggestionOrigin: 'clipboard' | null | undefined,
): ActionPanelSmartSuggestionViewModel | null => {
  if (!smartSuggestion) return null;

  const primaryAction = smartSuggestion.actions[0];
  if (!primaryAction) return null;

  const originLabel = getActionPanelSmartSuggestionOriginLabel(smartSuggestionOrigin);
  const titlePrefix = originLabel ? `${originLabel}：` : '';
  const ariaOrigin = originLabel ? `${originLabel}，` : '';

  return {
    primaryAction,
    originLabel,
    toneClassName: getActionPanelSmartSuggestionToneClassName(smartSuggestion.tone),
    collapsedAriaLabel: `智能建议：${ariaOrigin}${smartSuggestion.title}，${primaryAction.label}`,
    collapsedTitle: `${titlePrefix}${smartSuggestion.title}：${primaryAction.label}`,
    visibleActions: getVisibleActionPanelSmartSuggestionActions(smartSuggestion),
  };
};
