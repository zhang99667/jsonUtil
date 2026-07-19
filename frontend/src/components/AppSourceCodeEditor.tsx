import React from 'react';
import { DeferredCodeEditor } from './DeferredCodeEditor';
import { SourceEditorHeaderActions } from './EditorHeaderActions';
import { AppSourceErrorActionsSlot } from './AppSourceErrorActionsSlot';
import { buildAppSourceCodeEditorProps } from './appSourceCodeEditorProps';
import type { AppSourceCodeEditorProps } from './AppSourceCodeEditorTypes';

export type { AppSourceCodeEditorProps } from './AppSourceCodeEditorTypes';

export const AppSourceCodeEditor: React.FC<AppSourceCodeEditorProps> = (props) => {
  const {
    activeFileId,
    editorUiState,
    isProcessing,
    sourceValidation,
    onSourceAiFix,
    onPasteSource,
    onCopySource,
    onClearSource,
    onToggleAutoSave,
  } = props;

  return (
    <DeferredCodeEditor
      {...buildAppSourceCodeEditorProps(props)}
      errorActions={
        <AppSourceErrorActionsSlot
          sourceValidation={sourceValidation}
          hasSourceContent={editorUiState.hasSourceContent}
          repairTitle={editorUiState.sourceAiRepairTitle}
          isProcessing={isProcessing}
          onRepair={onSourceAiFix}
        />
      }
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
};
