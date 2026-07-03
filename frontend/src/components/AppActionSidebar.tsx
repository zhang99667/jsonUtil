import React from 'react';
import { AppSidebarResizeHandle } from './AppResizeHandles';
import {
  AppSidebarActionPanel,
  type AppSidebarActionPanelProps,
} from './AppSidebarActionPanel';
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH } from '../hooks/layoutResize';

interface AppActionSidebarProps extends AppSidebarActionPanelProps {
  isResizing: boolean;
  onStartResize: (event: React.MouseEvent<HTMLDivElement>) => void;
  onResizeKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const AppActionSidebar: React.FC<AppActionSidebarProps> = ({
  isResizing,
  onStartResize,
  onResizeKeyDown,
  ...actionPanelProps
}) => (
  <>
    <AppSidebarActionPanel {...actionPanelProps} />

    <AppSidebarResizeHandle
      isVisible={!actionPanelProps.isCollapsed}
      isResizing={isResizing}
      sidebarWidth={actionPanelProps.sidebarWidth}
      minWidth={SIDEBAR_MIN_WIDTH}
      maxWidth={SIDEBAR_MAX_WIDTH}
      onMouseDown={onStartResize}
      onKeyDown={onResizeKeyDown}
    />
  </>
);
