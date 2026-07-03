import React from 'react';
import { AppPaneResizeHandle } from './AppResizeHandles';
import { LEFT_PANE_MAX_PERCENT, LEFT_PANE_MIN_PERCENT } from '../hooks/layoutResize';

interface AppEditorSplitPanesProps {
  sourcePane: React.ReactNode;
  previewPane: React.ReactNode;
  leftPaneWidthPercent: number;
  isPaneResizing: boolean;
  onPaneResizeMouseDown: React.MouseEventHandler<HTMLDivElement>;
  onPaneResizeKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

export const AppEditorSplitPanes: React.FC<AppEditorSplitPanesProps> = ({
  sourcePane,
  previewPane,
  leftPaneWidthPercent,
  isPaneResizing,
  onPaneResizeMouseDown,
  onPaneResizeKeyDown,
}) => (
  <div className="flex-1 flex min-h-0">
    {sourcePane}
    <AppPaneResizeHandle
      isResizing={isPaneResizing}
      leftPaneWidthPercent={leftPaneWidthPercent}
      minPercent={LEFT_PANE_MIN_PERCENT}
      maxPercent={LEFT_PANE_MAX_PERCENT}
      onMouseDown={onPaneResizeMouseDown}
      onKeyDown={onPaneResizeKeyDown}
    />
    {previewPane}
  </div>
);
