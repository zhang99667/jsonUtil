import React from 'react';
import { ActionPanelEntryButton } from './ActionPanelEntryButton';
import { getActionPanelToolEntryButtonState } from '../utils/actionPanelEntryButtonState';
import type { ActionPanelToolButtonProps } from './ActionPanelButtonTypes';

export const ActionPanelToolButton: React.FC<ActionPanelToolButtonProps> = ({
  mode,
  label,
  icon,
  colorClass,
  dataTour,
  isActive,
  isCollapsed,
  onClick,
}) => (
  <ActionPanelEntryButton
    state={getActionPanelToolEntryButtonState({ label, colorClass, isActive, isCollapsed })}
    dataTour={dataTour}
    isCollapsed={isCollapsed}
    onClick={() => onClick(mode)}
    label={label}
    icon={icon}
  />
);
