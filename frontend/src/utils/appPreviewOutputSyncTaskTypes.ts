import type {
  TransformContext,
  ValidationResult,
} from '../types';
import type { AppPreviewOutputSyncRequestInput } from './appPreviewOutputSyncRequest';
import type { MutableValueRef } from './mutableValueRef';

export type PreviewOutputSyncTask = (isCurrent: () => boolean) => Promise<boolean>;

export type AppPreviewOutputSyncTaskRequest = Omit<
  AppPreviewOutputSyncRequestInput,
  'originalInput' | 'fallbackContext'
>;

export interface AppPreviewOutputSyncTaskInput {
  request: AppPreviewOutputSyncTaskRequest;
  refs: AppPreviewOutputSyncTaskRefs;
  applyEffects: AppPreviewOutputSyncTaskApplyEffects;
}

export interface AppPreviewOutputSyncTaskRefs {
  inputRef: MutableValueRef<string>;
  fallbackContextRef: MutableValueRef<TransformContext | null>;
  pendingOutputValue: MutableValueRef<string>;
}

export interface AppPreviewOutputSyncTaskApplyEffects {
  setPreviewValidation: (validation: ValidationResult) => void;
  onSetInput: (value: string) => void;
  onUpdateActiveFileContent: (value: string) => void;
}
