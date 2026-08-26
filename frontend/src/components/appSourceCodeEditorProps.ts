import type { AppSourceCodeEditorProps } from './AppSourceCodeEditorTypes';
import type { EditorProps } from '../types';

type AppSourceCodeEditorMappedProps = Pick<
  EditorProps,
  | 'value' | 'originalValue' | 'path' | 'onChange' | 'onFocus' | 'onCursorPositionChange'
  | 'onEditorMount'
  | 'label' | 'files' | 'activeFileId' | 'onTabClick' | 'onCloseFile' | 'onNewTab'
  | 'placeholder' | 'error' | 'errorLocation'
  | 'warning' | 'diagnosticHighlights' | 'locateErrorSignal'
> & {
  enableSchemeScan: true;
};

export const buildAppSourceCodeEditorProps = ({
  input,
  activeFile,
  activeFileId,
  files,
  sourceValidation,
  sourceErrorLocation,
  sourceErrorLocateSignal,
  jsonSchemaWarning,
  jsonSchemaDiagnosticHighlights,
  onSourceEditorMount,
  onInputChange,
  onSourceFocus,
  onCursorPositionChange,
  onTabClick,
  onCloseFile,
  onNewTab,
}: AppSourceCodeEditorProps): AppSourceCodeEditorMappedProps => ({
  value: input,
  originalValue: activeFile?.savedContent,
  path: activeFileId || undefined,
  onEditorMount: onSourceEditorMount,
  onChange: onInputChange,
  onFocus: onSourceFocus,
  onCursorPositionChange,
  label: 'SOURCE',
  files,
  activeFileId,
  onTabClick,
  onCloseFile,
  onNewTab,
  enableSchemeScan: true,
  placeholder: '// 在此输入 JSON 或文本...',
  error: sourceValidation.isValid ? undefined : sourceValidation.error,
  errorLocation: sourceErrorLocation,
  warning: jsonSchemaWarning,
  diagnosticHighlights: jsonSchemaDiagnosticHighlights,
  locateErrorSignal: sourceErrorLocateSignal,
});
