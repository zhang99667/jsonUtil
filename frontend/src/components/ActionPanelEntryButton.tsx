import React from 'react';
import { ActionPanelButtonBadge } from './ActionPanelButtonBadge';
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
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate">{label}</span>
        {state.entryProps.badge && (
          <ActionPanelButtonBadge
            label={state.entryProps.badge.label}
            dataTour={state.entryProps.badge.dataTour}
            ariaHidden={state.entryProps.badge.ariaHidden}
          />
        )}
      </span>
    )}
  </button>
);
