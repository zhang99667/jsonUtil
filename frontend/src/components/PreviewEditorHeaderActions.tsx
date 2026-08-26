import React from 'react';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import { EditorHeaderActionButton } from './EditorHeaderActionButton';
import {
  editorHeaderBaseButtonClassName,
  editorHeaderDisabledButtonClassName,
  editorHeaderStandardButtonClassName,
} from './editorHeaderActionStyles';

interface PreviewEditorHeaderActionsProps {
  editorUiState: AppEditorUiState;
  isOutputTransforming: boolean;
  showTransformReportButton: boolean;
  hasTransformReportContext: boolean;
  isScrollSyncEnabled: boolean;
  onOpenTransformReport: () => void;
  onApplyPreviewToSource: () => void;
  onCopyPreview: () => void;
  onToggleScrollSync: () => void;
}

export const PreviewEditorHeaderActions: React.FC<PreviewEditorHeaderActionsProps> = ({
  editorUiState,
  isOutputTransforming,
  showTransformReportButton,
  hasTransformReportContext,
  isScrollSyncEnabled,
  onOpenTransformReport,
  onApplyPreviewToSource,
  onCopyPreview,
  onToggleScrollSync,
}) => (
  <>
    <EditorHeaderActionButton
      dataTour="sync-editor-scroll"
      ariaLabel={isScrollSyncEnabled
        ? '关闭 SOURCE 与 PREVIEW 同步滚动'
        : '开启 SOURCE 与 PREVIEW 同步滚动'}
      ariaPressed={isScrollSyncEnabled}
      onClick={onToggleScrollSync}
      className={`${editorHeaderBaseButtonClassName} border ${isScrollSyncEnabled
        ? 'border-sky-400/60 bg-sky-500/15 text-sky-200'
        : 'border-transparent text-gray-400 hover:bg-editor-active hover:text-gray-200'}`}
      title={isScrollSyncEnabled
        ? '关闭 SOURCE 与 PREVIEW 同步滚动'
        : '开启 SOURCE 与 PREVIEW 同步滚动'}
      iconId="syncScroll"
      label="同步滚动"
    />
    {showTransformReportButton && (
      <EditorHeaderActionButton
        dataTour="transform-report-button"
        ariaLabel={editorUiState.transformReportTitle}
        onClick={onOpenTransformReport}
        disabled={!hasTransformReportContext || isOutputTransforming}
        className={`${editorHeaderBaseButtonClassName} text-cyan-200 hover:bg-editor-active disabled:opacity-50 disabled:cursor-not-allowed`}
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
      className={`${editorHeaderStandardButtonClassName} hover:text-emerald-200 ${editorHeaderDisabledButtonClassName}`}
      title={editorUiState.applyPreviewTitle}
      iconId="applyToSource"
      label="应用到源"
    />
    <EditorHeaderActionButton
      dataTour="copy-preview"
      ariaLabel={editorUiState.copyPreviewTitle}
      onClick={onCopyPreview}
      disabled={!editorUiState.hasPreviewContent || isOutputTransforming}
      className={`${editorHeaderStandardButtonClassName} ${editorHeaderDisabledButtonClassName}`}
      title={editorUiState.copyPreviewTitle}
      iconId="copy"
      label="复制"
    />
  </>
);
