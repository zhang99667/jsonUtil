import React from 'react';
import { AppAiRepairSummarySlot } from './AppAiRepairSummarySlot';
import { AppEditorSplitPanes } from './AppEditorSplitPanes';
import { AppPreviewEditorPane, type AppPreviewEditorPaneProps } from './AppPreviewEditorPane';
import { AppSourceEditorPane, type AppSourceEditorPaneProps } from './AppSourceEditorPane';
import type { AiRepairSummary } from '../utils/aiRepairSummary';

interface AppEditorWorkspaceProps extends AppSourceEditorPaneProps, AppPreviewEditorPaneProps {
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
}) => (
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
          onCursorPositionChange={onCursorPositionChange}
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
          onCursorPositionChange={onCursorPositionChange}
          onOpenTransformReport={onOpenTransformReport}
          onApplyPreviewToSource={onApplyPreviewToSource}
          onCopyPreview={onCopyPreview}
          onSchemeEdit={onSchemeEdit}
        />
      )}
    />
  </div>
);
