import React from 'react';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import { EditorHeaderActionButton } from './EditorHeaderActionButton';

interface SourceEditorHeaderActionsProps {
  editorUiState: AppEditorUiState;
  hasActiveFile: boolean;
  onPasteSource: () => void;
  onCopySource: () => void;
  onClearSource: () => void;
  onToggleAutoSave: () => void;
}

interface PreviewEditorHeaderActionsProps {
  editorUiState: AppEditorUiState;
  isOutputTransforming: boolean;
  showTransformReportButton: boolean;
  hasTransformReportContext: boolean;
  onOpenTransformReport: () => void;
  onApplyPreviewToSource: () => void;
  onCopyPreview: () => void;
}

const baseButtonClassName = 'editor-header-action flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors';
const standardButtonClassName = `${baseButtonClassName} text-gray-400 hover:bg-editor-active border border-transparent`;
const disabledButtonClassName = 'disabled:cursor-not-allowed disabled:opacity-50';

const getAutoSaveClassName = (editorUiState: AppEditorUiState, hasActiveFile: boolean): string => {
  if (!hasActiveFile) {
    return `${baseButtonClassName} text-gray-600 border border-transparent cursor-not-allowed opacity-50`;
  }
  if (editorUiState.isAutoSaveActive) {
    return `${baseButtonClassName} bg-status-success-bg text-status-success-text border border-status-success-border`;
  }
  if (editorUiState.canUseAutoSave) {
    return `${baseButtonClassName} text-gray-400 border border-transparent hover:bg-editor-active`;
  }
  return `${baseButtonClassName} text-gray-600 border border-transparent cursor-not-allowed opacity-50`;
};

const getAutoSaveDotClassName = (editorUiState: AppEditorUiState, hasActiveFile: boolean): string => {
  if (!hasActiveFile) return 'bg-gray-700';
  return editorUiState.isAutoSaveActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500';
};

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
      className={`${standardButtonClassName} hover:text-blue-200`}
      title="从剪贴板粘贴到 SOURCE"
      iconId="paste"
      label="粘贴"
    />
    <EditorHeaderActionButton
      dataTour="copy-source"
      ariaLabel={editorUiState.copySourceTitle}
      onClick={onCopySource}
      disabled={!editorUiState.hasSourceContent}
      className={`${standardButtonClassName} ${disabledButtonClassName}`}
      title={editorUiState.copySourceTitle}
      iconId="copy"
      label="复制源"
    />
    <EditorHeaderActionButton
      dataTour="clear-source"
      ariaLabel={editorUiState.clearSourceTitle}
      onClick={onClearSource}
      disabled={!editorUiState.hasSourceContent}
      className={`${baseButtonClassName} text-gray-400 hover:bg-red-900/30 hover:text-red-200 border border-transparent ${disabledButtonClassName}`}
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

export const PreviewEditorHeaderActions: React.FC<PreviewEditorHeaderActionsProps> = ({
  editorUiState,
  isOutputTransforming,
  showTransformReportButton,
  hasTransformReportContext,
  onOpenTransformReport,
  onApplyPreviewToSource,
  onCopyPreview,
}) => (
  <>
    {showTransformReportButton && (
      <EditorHeaderActionButton
        dataTour="transform-report-button"
        ariaLabel={editorUiState.transformReportTitle}
        onClick={onOpenTransformReport}
        disabled={!hasTransformReportContext || isOutputTransforming}
        className={`${baseButtonClassName} text-cyan-200 hover:bg-editor-active disabled:opacity-50 disabled:cursor-not-allowed`}
        title={editorUiState.transformReportTitle}
        iconId="report"
        label="报告"
      />
    )}
    <EditorHeaderActionButton
      dataTour="apply-preview-to-source"
      ariaLabel={editorUiState.applyPreviewTitle}
      onClick={onApplyPreviewToSource}
      disabled={!editorUiState.hasPreviewContent || isOutputTransforming || editorUiState.isPreviewSameAsSource}
      className={`${standardButtonClassName} hover:text-emerald-200 ${disabledButtonClassName}`}
      title={editorUiState.applyPreviewTitle}
      iconId="applyToSource"
      label="应用到源"
    />
    <EditorHeaderActionButton
      dataTour="copy-preview"
      ariaLabel={editorUiState.copyPreviewTitle}
      onClick={onCopyPreview}
      disabled={!editorUiState.hasPreviewContent || isOutputTransforming}
      className={`${standardButtonClassName} ${disabledButtonClassName}`}
      title={editorUiState.copyPreviewTitle}
      iconId="copy"
      label="复制"
    />
  </>
);
