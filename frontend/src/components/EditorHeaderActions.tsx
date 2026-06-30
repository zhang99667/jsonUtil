import React from 'react';
import type { AppEditorUiState } from '../utils/appEditorUiState';

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
const iconClassName = 'w-3 h-3';

const CopyIcon: React.FC = () => (
  <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PasteIcon: React.FC = () => (
  <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0a2 2 0 104 0m-4 0a2 2 0 114 0m-2 7v6m0 0l-2-2m2 2l2-2" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-8 0h10" />
  </svg>
);

const ReportIcon: React.FC = () => (
  <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-4M5 19h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ApplyToSourceIcon: React.FC = () => (
  <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

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
    <button
      data-tour="paste-source"
      aria-label="粘贴到源内容"
      onClick={onPasteSource}
      className={`${standardButtonClassName} hover:text-blue-200`}
      title="从剪贴板粘贴到 SOURCE"
    >
      <PasteIcon />
      <span className="editor-header-action-label">粘贴</span>
    </button>
    <button
      data-tour="copy-source"
      aria-label={editorUiState.copySourceTitle}
      onClick={onCopySource}
      disabled={!editorUiState.hasSourceContent}
      className={`${standardButtonClassName} ${disabledButtonClassName}`}
      title={editorUiState.copySourceTitle}
    >
      <CopyIcon />
      <span className="editor-header-action-label">复制源</span>
    </button>
    <button
      data-tour="clear-source"
      aria-label={editorUiState.clearSourceTitle}
      onClick={onClearSource}
      disabled={!editorUiState.hasSourceContent}
      className={`${baseButtonClassName} text-gray-400 hover:bg-red-900/30 hover:text-red-200 border border-transparent ${disabledButtonClassName}`}
      title={editorUiState.clearSourceTitle}
    >
      <TrashIcon />
      <span className="editor-header-action-label">清空</span>
    </button>
    <button
      data-tour="auto-save"
      aria-label={editorUiState.autoSaveAriaLabel}
      aria-pressed={editorUiState.isAutoSaveActive}
      onClick={onToggleAutoSave}
      className={getAutoSaveClassName(editorUiState, hasActiveFile)}
      title={editorUiState.autoSaveTitle}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${getAutoSaveDotClassName(editorUiState, hasActiveFile)}`}></div>
      <span className="editor-header-action-label">自动保存</span>
    </button>
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
      <button
        data-tour="transform-report-button"
        aria-label={editorUiState.transformReportTitle}
        onClick={onOpenTransformReport}
        disabled={!hasTransformReportContext || isOutputTransforming}
        className={`${baseButtonClassName} text-cyan-200 hover:bg-editor-active disabled:opacity-50 disabled:cursor-not-allowed`}
        title={editorUiState.transformReportTitle}
      >
        <ReportIcon />
        <span className="editor-header-action-label">报告</span>
      </button>
    )}
    <button
      data-tour="apply-preview-to-source"
      aria-label={editorUiState.applyPreviewTitle}
      onClick={onApplyPreviewToSource}
      disabled={!editorUiState.hasPreviewContent || isOutputTransforming || editorUiState.isPreviewSameAsSource}
      className={`${standardButtonClassName} hover:text-emerald-200 ${disabledButtonClassName}`}
      title={editorUiState.applyPreviewTitle}
    >
      <ApplyToSourceIcon />
      <span className="editor-header-action-label">应用到源</span>
    </button>
    <button
      data-tour="copy-preview"
      aria-label={editorUiState.copyPreviewTitle}
      onClick={onCopyPreview}
      disabled={!editorUiState.hasPreviewContent || isOutputTransforming}
      className={`${standardButtonClassName} ${disabledButtonClassName}`}
      title={editorUiState.copyPreviewTitle}
    >
      <CopyIcon />
      <span className="editor-header-action-label">复制</span>
    </button>
  </>
);
