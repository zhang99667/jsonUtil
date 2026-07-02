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
  onOpenTransformReport: () => void;
  onApplyPreviewToSource: () => void;
  onCopyPreview: () => void;
}

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
