import React from 'react';
import { CodeEditor } from './Editor';
import { PreviewEditorHeaderActions } from './EditorHeaderActions';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import type {
  EditorLocation,
  HighlightRange,
  ValidationResult,
} from '../types';

export interface AppPreviewCodeEditorProps {
  output: string;
  isOutputTransforming: boolean;
  previewValidation: ValidationResult;
  previewErrorLocation: EditorLocation | null;
  deepFormatWarning?: string;
  deepFormatInfo?: string;
  hasTransformReportContext: boolean;
  highlightRange: HighlightRange | null;
  editorUiState: AppEditorUiState;
  onOutputChange: (value: string) => void;
  onPreviewFocus: () => void;
  onCursorPositionChange: (line: number, column: number) => void;
  onOpenTransformReport: () => void;
  onApplyPreviewToSource: () => void;
  onCopyPreview: () => void;
  onSchemeEdit: (jsonPath: string, newValue: string, pointer?: string) => void;
}

export const AppPreviewCodeEditor: React.FC<AppPreviewCodeEditorProps> = ({
  output,
  isOutputTransforming,
  previewValidation,
  previewErrorLocation,
  deepFormatWarning,
  deepFormatInfo,
  hasTransformReportContext,
  highlightRange,
  editorUiState,
  onOutputChange,
  onPreviewFocus,
  onCursorPositionChange,
  onOpenTransformReport,
  onApplyPreviewToSource,
  onCopyPreview,
  onSchemeEdit,
}) => (
  <CodeEditor
    label="PREVIEW"
    value={output}
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
    highlightRange={highlightRange}
    onSchemeEdit={onSchemeEdit}
    headerActions={
      <PreviewEditorHeaderActions
        editorUiState={editorUiState}
        isOutputTransforming={isOutputTransforming}
        showTransformReportButton={Boolean(deepFormatInfo)}
        hasTransformReportContext={hasTransformReportContext}
        onOpenTransformReport={onOpenTransformReport}
        onApplyPreviewToSource={onApplyPreviewToSource}
        onCopyPreview={onCopyPreview}
      />
    }
  />
);
