import React from 'react';
import { AppAiRepairSummarySlot } from './AppAiRepairSummarySlot';
import { AppEditorSplitPanes } from './AppEditorSplitPanes';
import { AppPreviewEditorPane } from './AppPreviewEditorPane';
import { AppSourceEditorPane } from './AppSourceEditorPane';
import {
  buildAppEditorWorkspacePreviewPaneProps,
  buildAppEditorWorkspaceSourcePaneProps,
} from './appEditorWorkspacePaneProps';
import type { AppEditorWorkspaceProps } from './AppEditorWorkspaceTypes';
import { shouldAcceptEditorCursorPosition } from '../utils/appEditorCursorPosition';

export const AppEditorWorkspace: React.FC<AppEditorWorkspaceProps> = (props) => {
  const {
    activeEditor,
    leftPaneWidthPercent,
    isPaneResizing,
    aiRepairSummary,
    onCursorPositionChange,
    onPaneResizeMouseDown,
    onPaneResizeKeyDown,
    onCloseAiRepairSummary,
    onCopyAiRepairSummarySuccess,
    onCopyAiRepairSummaryError,
  } = props;
  const handleSourceCursorPositionChange = (line: number, column: number) => {
    if (shouldAcceptEditorCursorPosition(activeEditor, 'SOURCE')) {
      onCursorPositionChange(line, column);
    }
  };

  const handlePreviewCursorPositionChange = (line: number, column: number) => {
    if (shouldAcceptEditorCursorPosition(activeEditor, 'PREVIEW')) {
      onCursorPositionChange(line, column);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-editor-bg">
      <AppAiRepairSummarySlot
        summary={aiRepairSummary}
        onClose={onCloseAiRepairSummary}
        onCopySuccess={onCopyAiRepairSummarySuccess}
        onCopyError={onCopyAiRepairSummaryError}
      />

      <AppEditorSplitPanes
        leftPaneWidthPercent={leftPaneWidthPercent}
        isPaneResizing={isPaneResizing}
        onPaneResizeMouseDown={onPaneResizeMouseDown}
        onPaneResizeKeyDown={onPaneResizeKeyDown}
        sourcePane={(
          <AppSourceEditorPane
            {...buildAppEditorWorkspaceSourcePaneProps(props, handleSourceCursorPositionChange)}
          />
        )}
        previewPane={(
          <AppPreviewEditorPane
            {...buildAppEditorWorkspacePreviewPaneProps(props, handlePreviewCursorPositionChange)}
          />
        )}
      />
    </div>
  );
};
