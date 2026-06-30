import React from 'react';
import type { ActionPanelEntryIconState } from '../utils/actionPanelEntryButtonState';

interface ActionPanelEntryIconSlotProps {
  state: ActionPanelEntryIconState;
  children: React.ReactNode;
}

export const ActionPanelEntryIconSlot: React.FC<ActionPanelEntryIconSlotProps> = ({
  state,
  children,
}) => (
  <div className={state.iconWrapperClassName}>
    {state.iconInnerClassName ? (
      <span className={state.iconInnerClassName}>{children}</span>
    ) : children}
  </div>
);
