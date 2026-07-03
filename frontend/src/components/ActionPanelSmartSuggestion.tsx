import React from 'react';
import type { SmartInputSuggestion, SmartSuggestionActionId } from '../utils/smartInputSuggestion';
import { buildActionPanelSmartSuggestionViewModel } from '../utils/actionPanelSmartSuggestionViewModel';
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
  const viewModel = buildActionPanelSmartSuggestionViewModel(
    smartSuggestion,
    smartSuggestionOrigin
  );
  if (!viewModel) return null;

  if (isCollapsed) {
    return (
      <button
        data-tour="smart-action-suggestion"
        onClick={() => onSmartSuggestionAction(viewModel.primaryAction.id)}
        aria-label={viewModel.collapsedAriaLabel}
        title={viewModel.collapsedTitle}
        className={`mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border transition-all hover:bg-editor-hover active:scale-95 ${viewModel.toneClassName}`}
      >
        <ActionPanelSmartSuggestionIcon className="h-5 w-5 flex-shrink-0" />
      </button>
    );
  }

  return (
    <div
      data-tour="smart-action-suggestion"
      className={`mb-4 rounded-lg border p-3 shadow-sm ${viewModel.toneClassName}`}
    >
      <ActionPanelSmartSuggestionHeader
        smartSuggestion={smartSuggestion}
        originLabel={viewModel.originLabel}
      />
      <div className="grid grid-cols-2 gap-1.5">
        {viewModel.visibleActions.map((action, index) => (
          <ActionPanelSmartSuggestionActionButton
            key={action.id}
            action={action}
            index={index}
            isWide={viewModel.visibleActions.length === 3 && index === 2}
            onAction={onSmartSuggestionAction}
          />
        ))}
      </div>
    </div>
  );
};
