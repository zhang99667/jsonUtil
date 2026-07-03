import type {
  FileTab,
  TransformContext,
  TransformMode,
  ValidationResult,
} from '../types';
import type { MutableValueRef } from './mutableValueRef';

export interface AppPreviewOutputSyncTaskInput {
  previewText: string;
  files: FileTab[];
  activeFileId: string | null;
  mode: TransformMode;
  inputRef: MutableValueRef<string>;
  fallbackContextRef: MutableValueRef<TransformContext | null>;
  pendingOutputValue: MutableValueRef<string>;
  validateJsonMaybeAsync: (
    value: string,
    options?: { requireContainer?: boolean }
  ) => Promise<ValidationResult>;
  setPreviewValidation: (validation: ValidationResult) => void;
  onSetInput: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
}
