import React from 'react';
import {
  AppResizeSeparator,
  resizeHandleBaseClassName,
} from './AppResizeSeparator';

interface AppSidebarResizeHandleProps {
  isVisible: boolean;
  isResizing: boolean;
  sidebarWidth: number;
  minWidth: number;
  maxWidth: number;
  onMouseDown: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

interface AppPaneResizeHandleProps {
  isResizing: boolean;
  leftPaneWidthPercent: number;
  minPercent: number;
  maxPercent: number;
  onMouseDown: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

export const AppSidebarResizeHandle: React.FC<AppSidebarResizeHandleProps> = ({
  isVisible,
  isResizing,
  sidebarWidth,
  minWidth,
  maxWidth,
  onMouseDown,
  onKeyDown,
}) => {
  if (!isVisible) return null;

  return (
    <AppResizeSeparator
      tourId="sidebar-resize-handle"
      ariaLabel="调整工具栏宽度"
      valueMin={minWidth}
      valueMax={maxWidth}
      valueNow={Math.round(sidebarWidth)}
      valueText={`工具栏宽度 ${Math.round(sidebarWidth)} 像素`}
      className={`absolute top-0 bottom-0 w-1 ${resizeHandleBaseClassName} ${isResizing ? 'bg-brand-primary' : 'bg-transparent'}`}
      style={{ left: sidebarWidth - 2 }}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      title="拖拽或用方向键调整工具栏宽度"
    />
  );
};

export const AppPaneResizeHandle: React.FC<AppPaneResizeHandleProps> = ({
  isResizing,
  leftPaneWidthPercent,
  minPercent,
  maxPercent,
  onMouseDown,
  onKeyDown,
}) => (
  <AppResizeSeparator
    tourId="editor-pane-resize-handle"
    ariaLabel="调整 SOURCE 和 PREVIEW 宽度"
    valueMin={minPercent}
    valueMax={maxPercent}
    valueNow={Math.round(leftPaneWidthPercent)}
    valueText={`SOURCE 宽度 ${Math.round(leftPaneWidthPercent)}%`}
    className={`w-1 flex-shrink-0 ${resizeHandleBaseClassName} ${isResizing ? 'bg-brand-primary' : 'bg-editor-sidebar'}`}
    onMouseDown={onMouseDown}
    onKeyDown={onKeyDown}
    title="拖拽或用方向键调整 SOURCE/PREVIEW 宽度"
  />
);
