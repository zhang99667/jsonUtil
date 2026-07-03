import type { MutableRefObject } from 'react';
import type {
  FileTab,
  TransformContext,
  TransformMode,
  ValidationResult,
} from '../types';

export interface UseAppPreviewOutputSyncInput {
  previewText: string;
  files: FileTab[];
  activeFileId: string | null;
  mode: TransformMode;
  inputRef: MutableRefObject<string>;
  fallbackContextRef: MutableRefObject<TransformContext | null>;
  isUpdatingFromOutput: MutableRefObject<boolean>;
  pendingOutputValue: MutableRefObject<string>;
  validateJsonMaybeAsync: (
    value: string,
    options?: { requireContainer?: boolean }
  ) => Promise<ValidationResult>;
  onSetInput: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
}
