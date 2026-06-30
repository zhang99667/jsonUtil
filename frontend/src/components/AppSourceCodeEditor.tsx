import React from 'react';
import { CodeEditor } from './Editor';
import { SourceEditorHeaderActions } from './EditorHeaderActions';
import { AppSourceErrorActionsSlot } from './AppSourceErrorActionsSlot';
import type { AppSourceCodeEditorProps } from './AppSourceCodeEditorTypes';

export type { AppSourceCodeEditorProps } from './AppSourceCodeEditorTypes';

export const AppSourceCodeEditor: React.FC<AppSourceCodeEditorProps> = ({
  input,
  activeFile,
  activeFileId,
  files,
  isProcessing,
  sourceValidation,
  sourceErrorLocation,
  sourceErrorLocateSignal,
  jsonSchemaWarning,
  jsonSchemaDiagnosticHighlights,
  editorUiState,
  onInputChange,
  onSourceFocus,
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
}) => (
  <CodeEditor
    value={input}
    originalValue={activeFile?.savedContent}
    path={activeFileId || undefined}
    onChange={onInputChange}
    onFocus={onSourceFocus}
    onCursorPositionChange={onCursorPositionChange}
    label="SOURCE"
    files={files}
    activeFileId={activeFileId}
    onTabClick={onTabClick}
    onCloseFile={onCloseFile}
    onNewTab={onNewTab}
    onSaveViewState={onSaveViewState}
    restoreViewState={activeFile?.viewState}
    enableSchemeScan={true}
    placeholder="// 在此输入 JSON 或文本..."
    error={sourceValidation.isValid ? undefined : sourceValidation.error}
    errorLocation={sourceErrorLocation}
    warning={jsonSchemaWarning}
    diagnosticHighlights={jsonSchemaDiagnosticHighlights}
    errorActions={
      <AppSourceErrorActionsSlot
        sourceValidation={sourceValidation}
        hasSourceContent={editorUiState.hasSourceContent}
        repairTitle={editorUiState.sourceAiRepairTitle}
        isProcessing={isProcessing}
        onRepair={onSourceAiFix}
      />
    }
    locateErrorSignal={sourceErrorLocateSignal}
    headerActions={
      <SourceEditorHeaderActions
        editorUiState={editorUiState}
        hasActiveFile={Boolean(activeFileId)}
        onPasteSource={onPasteSource}
        onCopySource={onCopySource}
        onClearSource={onClearSource}
        onToggleAutoSave={onToggleAutoSave}
      />
    }
  />
);
