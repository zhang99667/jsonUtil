import React from 'react';
import { ActionPanelEntryButtonContent } from './ActionPanelEntryButtonContent';
import { ActionPanelEntryIconSlot } from './ActionPanelEntryIconSlot';
import { getActionPanelButtonClassName } from '../utils/actionPanelButtonState';
import type { ActionPanelEntryButtonState } from '../utils/actionPanelEntryButtonState';

interface ActionPanelEntryButtonProps {
  label: string;
  icon: React.ReactNode;
  state: ActionPanelEntryButtonState;
  dataTour?: string;
  isCollapsed: boolean;
  onClick: () => void;
}

export const ActionPanelEntryButton: React.FC<ActionPanelEntryButtonProps> = ({
  label,
  icon,
  state,
  dataTour,
  isCollapsed,
  onClick,
}) => (
  <button
    data-tour={dataTour}
    aria-pressed={state.entryProps.isActive}
    aria-label={state.entryProps.ariaLabel}
    onClick={onClick}
    className={getActionPanelButtonClassName({ isActive: state.entryProps.isActive, isCollapsed })}
    title={state.entryProps.title}
  >
    <ActionPanelEntryIconSlot state={state.iconState}>{icon}</ActionPanelEntryIconSlot>
    {!isCollapsed && (
      <ActionPanelEntryButtonContent label={label} badge={state.entryProps.badge} />
    )}
  </button>
);
