import React from 'react';
import { ActionPanelEntryButton } from './ActionPanelEntryButton';
import { getActionPanelPanelEntryButtonState } from '../utils/actionPanelEntryButtonState';
import type { ActionPanelPanelButtonProps } from './ActionPanelButtonTypes';

export const ActionPanelPanelButton: React.FC<ActionPanelPanelButtonProps> = ({
  label,
  icon,
  iconClass,
  hoverIconClass,
  isOpen,
  isCollapsed,
  onClick,
  dataTour,
}) => {
  const buttonState = getActionPanelPanelEntryButtonState({ label, iconClass, hoverIconClass, isOpen, isCollapsed });

  return (
    <ActionPanelEntryButton
      state={buttonState}
      dataTour={dataTour}
      isCollapsed={isCollapsed}
      onClick={onClick}
      label={label}
      icon={icon}
    />
  );
};
