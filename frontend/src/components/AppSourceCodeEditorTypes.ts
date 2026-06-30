import type { AppEditorUiState } from '../utils/appEditorUiState';
import type {
  EditorDiagnosticHighlight,
  EditorLocation,
  FileTab,
  ValidationResult,
} from '../types';

export interface AppSourceCodeEditorProps {
  input: string;
  activeFile: FileTab | null;
  activeFileId: string | null;
  files: FileTab[];
  isProcessing: boolean;
  sourceValidation: ValidationResult;
  sourceErrorLocation: EditorLocation | null;
  sourceErrorLocateSignal: number;
  jsonSchemaWarning: string;
  jsonSchemaDiagnosticHighlights: EditorDiagnosticHighlight[];
  editorUiState: AppEditorUiState;
  onInputChange: (value: string) => void;
  onSourceFocus: () => void;
  onCursorPositionChange: (line: number, column: number) => void;
  onTabClick: (fileId: string) => void;
  onCloseFile: (fileId: string) => void;
  onNewTab: () => void;
  onSaveViewState: (fileId: string, viewState: unknown) => void;
  onSourceAiFix: () => void;
  onPasteSource: () => void;
  onCopySource: () => void;
  onClearSource: () => void;
  onToggleAutoSave: () => void;
}
