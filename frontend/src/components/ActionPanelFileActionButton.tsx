import React from 'react';
import { ActionType } from '../types';
import { getActionPanelFileButtonTitle } from '../utils/actionPanelFileActions';

interface ActionPanelFileActionButtonProps {
  action: ActionType;
  label: string;
  icon: React.ReactNode;
  dataTour: string;
  isCollapsed: boolean;
  onAction: (action: ActionType) => void;
}

const fileActionButtonClassName = 'w-full bg-editor-sidebar hover:bg-editor-hover border border-editor-border text-gray-300 text-xs font-medium px-4 py-3 rounded-xl transition-all flex items-center gap-2 group justify-center active:scale-95 mb-3';

export const ActionPanelFileActionButton: React.FC<ActionPanelFileActionButtonProps> = ({
  action,
  label,
  icon,
  dataTour,
  isCollapsed,
  onAction,
}) => (
  <button
    data-tour={dataTour}
    onClick={() => onAction(action)}
    aria-label={label}
    className={`${fileActionButtonClassName} ${isCollapsed ? 'px-2' : ''}`}
    title={getActionPanelFileButtonTitle(label, isCollapsed)}
  >
    {icon}
    {!isCollapsed && label}
  </button>
);
