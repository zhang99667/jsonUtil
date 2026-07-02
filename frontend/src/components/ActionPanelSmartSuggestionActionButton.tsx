import React from 'react';
import type { SmartSuggestionAction } from '../utils/smartInputSuggestion';

interface ActionPanelSmartSuggestionActionButtonProps {
  action: SmartSuggestionAction;
  index: number;
  isWide: boolean;
  onAction: (actionId: SmartSuggestionAction['id']) => void;
}

export const ActionPanelSmartSuggestionActionButton: React.FC<ActionPanelSmartSuggestionActionButtonProps> = ({
  action,
  index,
  isWide,
  onAction,
}) => (
  <button
    data-tour={`smart-action-${action.id}`}
    onClick={() => onAction(action.id)}
    aria-label={`智能建议动作 ${index + 1}: ${action.label}`}
    className={`min-w-0 rounded border border-white/10 bg-editor-bg/70 px-2 py-1.5 text-[11px] font-medium text-gray-100 transition-colors hover:border-white/20 hover:bg-editor-active active:scale-95 ${isWide ? 'col-span-2' : ''}`}
    title={action.label}
  >
    <span className="block truncate">{action.label}</span>
  </button>
);
