import type { MutableRefObject } from 'react';
import type {
  FileTab,
  TransformContext,
  TransformMode,
} from '../types';
import type { ValidateJsonMaybeAsync } from '../utils/jsonValidation';

export interface UseAppPreviewOutputSyncInput {
  previewText: string;
  files: FileTab[];
  activeFileId: string | null;
  mode: TransformMode;
  inputRef: MutableRefObject<string>;
  fallbackContextRef: MutableRefObject<TransformContext | null>;
  isUpdatingFromOutput: MutableRefObject<boolean>;
  pendingOutputValue: MutableRefObject<string>;
  validateJsonMaybeAsync: ValidateJsonMaybeAsync;
  onSetInput: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
}
