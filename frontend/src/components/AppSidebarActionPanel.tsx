import React from 'react';
import { ActionPanel, type ActionPanelProps } from './ActionPanel';

export interface AppSidebarActionPanelProps extends ActionPanelProps {
  sidebarWidth: number;
}

export const AppSidebarActionPanel: React.FC<AppSidebarActionPanelProps> = ({
  sidebarWidth,
  ...actionPanelProps
}) => (
  <div
    data-tour="toolbar"
    style={{ width: actionPanelProps.isCollapsed ? 64 : sidebarWidth }}
    className="flex-shrink-0 z-10 border-r border-editor-border transition-all duration-300 ease-in-out h-full overflow-hidden"
  >
    <ActionPanel {...actionPanelProps} />
  </div>
);
