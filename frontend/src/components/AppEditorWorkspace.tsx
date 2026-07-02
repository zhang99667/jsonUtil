import React from 'react';
import { AppAiRepairSummarySlot } from './AppAiRepairSummarySlot';
import { AppEditorSplitPanes } from './AppEditorSplitPanes';
import { AppPreviewEditorPane, type AppPreviewEditorPaneProps } from './AppPreviewEditorPane';
import { AppSourceEditorPane, type AppSourceEditorPaneProps } from './AppSourceEditorPane';
import { shouldAcceptEditorCursorPosition, type AppEditorFocusTarget } from '../utils/appEditorCursorPosition';
import type { AiRepairSummary } from '../utils/aiRepairSummary';

interface AppEditorWorkspaceProps extends AppSourceEditorPaneProps, AppPreviewEditorPaneProps {
  activeEditor: AppEditorFocusTarget | null;
  isPaneResizing: boolean;
  aiRepairSummary: AiRepairSummary | null;
  onPaneResizeMouseDown: React.MouseEventHandler<HTMLDivElement>;
  onPaneResizeKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  onCloseAiRepairSummary: () => void;
  onCopyAiRepairSummarySuccess: (message: string) => void;
  onCopyAiRepairSummaryError: (errorMessage: string) => void;
}

export const AppEditorWorkspace: React.FC<AppEditorWorkspaceProps> = ({
  input,
  output,
  activeFile,
  activeFileId,
  files,
  activeEditor,
  leftPaneWidthPercent,
  isPaneResizing,
  isProcessing,
  isOutputTransforming,
  aiRepairSummary,
  sourceValidation,
  previewValidation,
  sourceErrorLocation,
  previewErrorLocation,
  sourceErrorLocateSignal,
  jsonSchemaWarning,
  jsonSchemaDiagnosticHighlights,
  deepFormatWarning,
  deepFormatInfo,
  hasTransformReportContext,
  highlightRange,
  editorUiState,
  onInputChange,
  onOutputChange,
  onSourceFocus,
  onPreviewFocus,
  onCursorPositionChange,
  onTabClick,
  onCloseFile,
  onNewTab,
  onSaveViewState,
  onSourceAiFix,
  onPasteSource,
  onCopySource,
  onClearSource,
  onToggleAutoSave,
  onOpenTransformReport,
  onApplyPreviewToSource,
  onCopyPreview,
  onSchemeEdit,
  onPaneResizeMouseDown,
  onPaneResizeKeyDown,
  onCloseAiRepairSummary,
  onCopyAiRepairSummarySuccess,
  onCopyAiRepairSummaryError,
}) => {
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
            input={input}
            activeFile={activeFile}
            activeFileId={activeFileId}
            files={files}
            leftPaneWidthPercent={leftPaneWidthPercent}
            isProcessing={isProcessing}
            sourceValidation={sourceValidation}
            sourceErrorLocation={sourceErrorLocation}
            sourceErrorLocateSignal={sourceErrorLocateSignal}
            jsonSchemaWarning={jsonSchemaWarning}
            jsonSchemaDiagnosticHighlights={jsonSchemaDiagnosticHighlights}
            editorUiState={editorUiState}
            onInputChange={onInputChange}
            onSourceFocus={onSourceFocus}
            onCursorPositionChange={handleSourceCursorPositionChange}
            onTabClick={onTabClick}
            onCloseFile={onCloseFile}
            onNewTab={onNewTab}
            onSaveViewState={onSaveViewState}
            onSourceAiFix={onSourceAiFix}
            onPasteSource={onPasteSource}
            onCopySource={onCopySource}
            onClearSource={onClearSource}
            onToggleAutoSave={onToggleAutoSave}
          />
        )}
        previewPane={(
          <AppPreviewEditorPane
            output={output}
            isOutputTransforming={isOutputTransforming}
            previewValidation={previewValidation}
            previewErrorLocation={previewErrorLocation}
            deepFormatWarning={deepFormatWarning}
            deepFormatInfo={deepFormatInfo}
            hasTransformReportContext={hasTransformReportContext}
            highlightRange={highlightRange}
            editorUiState={editorUiState}
            onOutputChange={onOutputChange}
            onPreviewFocus={onPreviewFocus}
            onCursorPositionChange={handlePreviewCursorPositionChange}
            onOpenTransformReport={onOpenTransformReport}
            onApplyPreviewToSource={onApplyPreviewToSource}
            onCopyPreview={onCopyPreview}
            onSchemeEdit={onSchemeEdit}
          />
        )}
      />
    </div>
  );
};
