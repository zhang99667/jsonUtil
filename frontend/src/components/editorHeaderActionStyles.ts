import type { AppEditorUiState } from '../utils/appEditorUiState';

export const editorHeaderBaseButtonClassName = 'editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors';
export const editorHeaderStandardButtonClassName = `${editorHeaderBaseButtonClassName} text-gray-400 hover:bg-editor-active border border-transparent`;
export const editorHeaderDisabledButtonClassName = 'disabled:cursor-not-allowed disabled:opacity-50';

const autoSaveUnavailableButtonClassName = `${editorHeaderBaseButtonClassName} text-gray-600 border border-transparent cursor-not-allowed opacity-50`;
const autoSaveActiveButtonClassName = `${editorHeaderBaseButtonClassName} bg-status-success-bg text-status-success-text border border-status-success-border`;

export const getAutoSaveClassName = (
  editorUiState: AppEditorUiState,
  hasActiveFile: boolean
): string => {
  if (!hasActiveFile) return autoSaveUnavailableButtonClassName;
  if (editorUiState.isAutoSaveActive) return autoSaveActiveButtonClassName;
  if (!editorUiState.canUseAutoSave) return autoSaveUnavailableButtonClassName;
  return editorHeaderStandardButtonClassName;
};

export const getAutoSaveDotClassName = (
  editorUiState: AppEditorUiState,
  hasActiveFile: boolean
): string => {
  if (!hasActiveFile) return 'bg-gray-700';
  return editorUiState.isAutoSaveActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500';
};
