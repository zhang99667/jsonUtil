import React from 'react';

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
    <div
      data-tour="sidebar-resize-handle"
      role="separator"
      aria-label="调整工具栏宽度"
      aria-orientation="vertical"
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-valuenow={Math.round(sidebarWidth)}
      aria-valuetext={`工具栏宽度 ${Math.round(sidebarWidth)} 像素`}
      tabIndex={0}
      className={`absolute top-0 bottom-0 w-1 hover:bg-brand-primary focus-visible:bg-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 cursor-col-resize z-20 transition-colors delay-100 ${isResizing ? 'bg-brand-primary' : 'bg-transparent'}`}
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
  <div
    data-tour="editor-pane-resize-handle"
    role="separator"
    aria-label="调整 SOURCE 和 PREVIEW 宽度"
    aria-orientation="vertical"
    aria-valuemin={minPercent}
    aria-valuemax={maxPercent}
    aria-valuenow={Math.round(leftPaneWidthPercent)}
    aria-valuetext={`SOURCE 宽度 ${Math.round(leftPaneWidthPercent)}%`}
    tabIndex={0}
    className={`w-1 hover:bg-brand-primary focus-visible:bg-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 cursor-col-resize z-20 flex-shrink-0 transition-colors delay-100 ${isResizing ? 'bg-brand-primary' : 'bg-editor-sidebar'}`}
    onMouseDown={onMouseDown}
    onKeyDown={onKeyDown}
    title="拖拽或用方向键调整 SOURCE/PREVIEW 宽度"
  />
);
