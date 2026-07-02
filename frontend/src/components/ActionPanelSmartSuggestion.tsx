import React from 'react';
import {
  getActionPanelSmartSuggestionOriginLabel,
  getActionPanelSmartSuggestionToneClassName,
  getVisibleActionPanelSmartSuggestionActions,
} from '../utils/actionPanelSmartSuggestionState';
import type { SmartInputSuggestion, SmartSuggestionActionId } from '../utils/smartInputSuggestion';
import { ActionPanelSmartSuggestionActionButton } from './ActionPanelSmartSuggestionActionButton';
import { ActionPanelSmartSuggestionHeader } from './ActionPanelSmartSuggestionHeader';
import { ActionPanelSmartSuggestionIcon } from './ActionPanelSmartSuggestionIcon';

interface ActionPanelSmartSuggestionProps {
  smartSuggestion: SmartInputSuggestion | null;
  smartSuggestionOrigin?: 'clipboard' | null;
  isCollapsed: boolean;
  onSmartSuggestionAction: (actionId: SmartSuggestionActionId) => void;
}
export const ActionPanelSmartSuggestion: React.FC<ActionPanelSmartSuggestionProps> = ({
  smartSuggestion,
  smartSuggestionOrigin = null,
  isCollapsed,
  onSmartSuggestionAction,
}) => {
  if (!smartSuggestion) return null;

  const primaryAction = smartSuggestion.actions[0];
  if (!primaryAction) return null;

  const originLabel = getActionPanelSmartSuggestionOriginLabel(smartSuggestionOrigin);
  const toneClassName = getActionPanelSmartSuggestionToneClassName(smartSuggestion.tone);

  if (isCollapsed) {
    return (
      <button
        data-tour="smart-action-suggestion"
        onClick={() => onSmartSuggestionAction(primaryAction.id)}
        aria-label={`智能建议：${originLabel ? `${originLabel}，` : ''}${smartSuggestion.title}，${primaryAction.label}`}
        title={`${originLabel ? `${originLabel}：` : ''}${smartSuggestion.title}：${primaryAction.label}`}
        className={`mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border transition-all hover:bg-editor-hover active:scale-95 ${toneClassName}`}
      >
        <ActionPanelSmartSuggestionIcon className="h-5 w-5 flex-shrink-0" />
      </button>
    );
  }

  const visibleActions = getVisibleActionPanelSmartSuggestionActions(smartSuggestion);

  return (
    <div
      data-tour="smart-action-suggestion"
      className={`mb-4 rounded-lg border p-3 shadow-sm ${toneClassName}`}
    >
      <ActionPanelSmartSuggestionHeader
        smartSuggestion={smartSuggestion}
        originLabel={originLabel}
      />
      <div className="grid grid-cols-2 gap-1.5">
        {visibleActions.map((action, index) => (
          <ActionPanelSmartSuggestionActionButton
            key={action.id}
            action={action}
            index={index}
            isWide={visibleActions.length === 3 && index === 2}
            onAction={onSmartSuggestionAction}
          />
        ))}
      </div>
    </div>
  );
};
