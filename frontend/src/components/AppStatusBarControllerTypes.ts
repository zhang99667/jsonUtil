import type { FileTab, TransformMode, ValidationResult } from '../types';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import type { StatusBarSourceValidationLocation } from '../utils/statusBarState';

export type AppStatusBarActiveEditor = 'SOURCE' | 'PREVIEW' | null;

export interface AppStatusBarControllerProps {
  sourceText: string;
  previewText: string;
  activeEditor: AppStatusBarActiveEditor;
  mode: TransformMode;
  activeFileId: string | null;
  files: FileTab[];
  isAutoSaveEnabled: boolean;
  isSourceLarge: boolean;
  isOutputTransforming: boolean;
  isAiRepairing: boolean;
  isAiConfigured: boolean;
  editorUiState: Pick<
    AppEditorUiState,
    'hasSourceContent' | 'isSourceJsonCandidate' | 'sourceStandaloneDeepFormatKind'
  >;
  sourceValidation: ValidationResult;
  sourceValidationLocation: StatusBarSourceValidationLocation | null;
  onLocateSourceError: () => void;
  onOpenSourceSchemeInput: () => void;
  onOpenChangelog: () => void;
  cursorLine: number;
  cursorColumn: number;
}
