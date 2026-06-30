import React from 'react';
import { ActionType } from '../types';
import { getActionPanelAiFixButtonState } from '../utils/actionPanelFileActions';
import { ActionPanelAiFixIcon } from './ActionPanelAiFixIcon';
import type { ActionPanelAiFixButtonProps } from './ActionPanelButtonTypes';

export const ActionPanelAiFixButton: React.FC<ActionPanelAiFixButtonProps> = ({
  isCollapsed,
  isProcessing,
  onAction,
}) => {
  const buttonState = getActionPanelAiFixButtonState(isProcessing, isCollapsed);

  return (
    <button
      data-tour="ai-fix"
      onClick={() => onAction(ActionType.AI_FIX)}
      disabled={buttonState.disabled}
      aria-label={buttonState.ariaLabel}
      className={buttonState.className}
      title={buttonState.title}
    >
      <ActionPanelAiFixIcon isProcessing={isProcessing} />
      {!isCollapsed && buttonState.visibleLabel}
    </button>
  );
};
