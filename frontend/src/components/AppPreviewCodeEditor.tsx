import React from 'react';
import { DeferredCodeEditor } from './DeferredCodeEditor';
import { PreviewEditorHeaderActions } from './EditorHeaderActions';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import type { EditorLocation, EditorProps, HighlightRange, ValidationResult } from '../types';
import type { SchemeDisplayHeaderMarker } from '../utils/schemeDisplayHeader';

export interface AppPreviewCodeEditorProps {
  output: string;
  activeFileId: string | null;
  isOutputTransforming: boolean;
  previewValidation: ValidationResult;
  previewErrorLocation: EditorLocation | null;
  deepFormatWarning?: string;
  deepFormatInfo?: string;
  hasTransformReportContext: boolean;
  schemeDisplayHeaderMarkers: readonly SchemeDisplayHeaderMarker[];
  highlightRange: HighlightRange | null;
  editorUiState: AppEditorUiState;
  isScrollSyncEnabled: boolean;
  onPreviewEditorMount: NonNullable<EditorProps['onEditorMount']>;
  onOutputChange: (value: string) => void;
  onPreviewFocus: () => void;
  onCursorPositionChange: (line: number, column: number) => void;
  onOpenTransformReport: () => void;
  onApplyPreviewToSource: () => void;
  onCopyPreview: () => void;
  onToggleScrollSync: () => void;
  onSchemeEdit: (jsonPath: string, newValue: string, pointer?: string) => void;
}

export const AppPreviewCodeEditor: React.FC<AppPreviewCodeEditorProps> = ({
  output,
  activeFileId,
  isOutputTransforming,
  previewValidation,
  previewErrorLocation,
  deepFormatWarning,
  deepFormatInfo,
  hasTransformReportContext,
  schemeDisplayHeaderMarkers,
  highlightRange,
  editorUiState,
  isScrollSyncEnabled,
  onPreviewEditorMount,
  onOutputChange,
  onPreviewFocus,
  onCursorPositionChange,
  onOpenTransformReport,
  onApplyPreviewToSource,
  onCopyPreview,
  onToggleScrollSync,
  onSchemeEdit,
}) => (
  <DeferredCodeEditor
    label="PREVIEW"
    path={`preview-${activeFileId || 'standalone'}`}
    value={output}
    onEditorMount={onPreviewEditorMount}
    onChange={onOutputChange}
    onFocus={onPreviewFocus}
    onCursorPositionChange={onCursorPositionChange}
    readOnly={true}
    canToggleReadOnly={!isOutputTransforming}
    placeholder="// 结果显示区..."
    error={!previewValidation.isValid ? (previewValidation.error || 'Error') : undefined}
    errorLocation={previewErrorLocation}
    warning={deepFormatWarning}
    info={deepFormatInfo}
    schemeDisplayHeaderMarkers={schemeDisplayHeaderMarkers}
    highlightRange={highlightRange}
    onSchemeEdit={onSchemeEdit}
    headerActions={
      <PreviewEditorHeaderActions
        editorUiState={editorUiState}
        isOutputTransforming={isOutputTransforming}
        showTransformReportButton={Boolean(deepFormatInfo)}
        hasTransformReportContext={hasTransformReportContext}
        isScrollSyncEnabled={isScrollSyncEnabled}
        onOpenTransformReport={onOpenTransformReport}
        onApplyPreviewToSource={onApplyPreviewToSource}
        onCopyPreview={onCopyPreview}
        onToggleScrollSync={onToggleScrollSync}
      />
    }
  />
);
