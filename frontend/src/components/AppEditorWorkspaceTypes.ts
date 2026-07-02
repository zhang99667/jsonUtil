import type React from 'react';
import type { AppPreviewEditorPaneProps } from './AppPreviewEditorPane';
import type { AppSourceEditorPaneProps } from './AppSourceEditorPane';
import type { AppEditorFocusTarget } from '../utils/appEditorCursorPosition';
import type { AiRepairSummary } from '../utils/aiRepairSummary';

export interface AppEditorWorkspaceProps extends AppSourceEditorPaneProps, AppPreviewEditorPaneProps {
  activeEditor: AppEditorFocusTarget | null;
  isPaneResizing: boolean;
  aiRepairSummary: AiRepairSummary | null;
  onPaneResizeMouseDown: React.MouseEventHandler<HTMLDivElement>;
  onPaneResizeKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  onCloseAiRepairSummary: () => void;
  onCopyAiRepairSummarySuccess: (message: string) => void;
  onCopyAiRepairSummaryError: (errorMessage: string) => void;
}
