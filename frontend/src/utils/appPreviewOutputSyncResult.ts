import type { ValidationResult } from '../types';
import type { AppPreviewOutputSyncRunnerResult } from './appPreviewOutputSyncRunner';
import type { MutableValueRef } from './mutableValueRef';
import { keepPreviewOutputDraft } from './appPreviewOutputDraft';

interface AppPreviewOutputSyncResultInput {
  syncResult: AppPreviewOutputSyncRunnerResult;
  previewText: string;
  inputRef: MutableValueRef<string>;
  pendingOutputValue: MutableValueRef<string>;
  setPreviewValidation: (validation: ValidationResult) => void;
  onSetInput: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
}

export const applyAppPreviewOutputSyncResult = ({
  syncResult,
  previewText,
  inputRef,
  pendingOutputValue,
  setPreviewValidation,
  onSetInput,
  onUpdateActiveFileContent,
}: AppPreviewOutputSyncResultInput): boolean => {
  if (syncResult.status !== 'synced') {
    setPreviewValidation(syncResult.validation);
    keepPreviewOutputDraft(pendingOutputValue, previewText);
    return false;
  }

  const nextSource = syncResult.nextSource;
  onSetInput(nextSource);
  inputRef.current = nextSource;
  onUpdateActiveFileContent(nextSource);
  return true;
};
