import type { ReactNode } from 'react';
import type { ActionType, TransformMode } from '../types';

export interface ActionPanelAiFixButtonProps {
  isCollapsed: boolean;
  isProcessing: boolean;
  onAction: (action: ActionType) => void;
}

export interface ActionPanelToolButtonProps {
  mode: TransformMode;
  label: string;
  icon: ReactNode;
  colorClass: string;
  dataTour?: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: (mode: TransformMode) => void;
}

export interface ActionPanelPanelButtonProps {
  label: string;
  icon: ReactNode;
  iconClass: string;
  hoverIconClass: string;
  isOpen: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  dataTour: string;
}
