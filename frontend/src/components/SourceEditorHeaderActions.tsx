import React from 'react';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import { EditorHeaderActionButton } from './EditorHeaderActionButton';
import {
  editorHeaderBaseButtonClassName,
  editorHeaderDisabledButtonClassName,
  editorHeaderStandardButtonClassName,
  getAutoSaveClassName,
  getAutoSaveDotClassName,
} from './editorHeaderActionStyles';

interface SourceEditorHeaderActionsProps {
  editorUiState: AppEditorUiState;
  hasActiveFile: boolean;
  onPasteSource: () => void;
  onCopySource: () => void;
  onClearSource: () => void;
  onToggleAutoSave: () => void;
}

export const SourceEditorHeaderActions: React.FC<SourceEditorHeaderActionsProps> = ({
  editorUiState,
  hasActiveFile,
  onPasteSource,
  onCopySource,
  onClearSource,
  onToggleAutoSave,
}) => (
  <>
    <EditorHeaderActionButton
      dataTour="paste-source"
      ariaLabel="粘贴到源内容"
      onClick={onPasteSource}
      className={`${editorHeaderStandardButtonClassName} hover:text-blue-200`}
      title="从剪贴板粘贴到 SOURCE"
      iconId="paste"
      label="粘贴"
    />
    <EditorHeaderActionButton
      dataTour="copy-source"
      ariaLabel={editorUiState.copySourceTitle}
      onClick={onCopySource}
      disabled={!editorUiState.hasSourceContent}
      className={`${editorHeaderStandardButtonClassName} ${editorHeaderDisabledButtonClassName}`}
      title={editorUiState.copySourceTitle}
      iconId="copy"
      label="复制源"
    />
    <EditorHeaderActionButton
      dataTour="clear-source"
      ariaLabel={editorUiState.clearSourceTitle}
      onClick={onClearSource}
      disabled={!editorUiState.hasSourceContent}
      className={`${editorHeaderBaseButtonClassName} text-gray-400 hover:bg-red-900/30 hover:text-red-200 border border-transparent ${editorHeaderDisabledButtonClassName}`}
      title={editorUiState.clearSourceTitle}
      iconId="trash"
      label="清空"
    />
    <EditorHeaderActionButton
      dataTour="auto-save"
      ariaLabel={editorUiState.autoSaveAriaLabel}
      ariaPressed={editorUiState.isAutoSaveActive}
      onClick={onToggleAutoSave}
      className={getAutoSaveClassName(editorUiState, hasActiveFile)}
      title={editorUiState.autoSaveTitle}
      leadingAdornment={<div className={`w-1.5 h-1.5 rounded-full ${getAutoSaveDotClassName(editorUiState, hasActiveFile)}`}></div>}
      label="自动保存"
    />
  </>
);
