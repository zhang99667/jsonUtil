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
}) => (
  <ActionPanelEntryButton
    state={getActionPanelPanelEntryButtonState({ label, iconClass, hoverIconClass, isOpen, isCollapsed })}
    dataTour={dataTour}
    isCollapsed={isCollapsed}
    onClick={onClick}
    label={label}
    icon={icon}
  />
);
