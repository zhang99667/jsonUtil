import type { TransformContext, ValidationResult } from '../types';
import type { AppPreviewOutputSyncRequestInput } from './appPreviewOutputSyncRequest';
import type { MutableValueRef } from './mutableValueRef';

export type PreviewOutputSyncTask = (
  isCurrent: () => boolean,
  signal: AbortSignal
) => Promise<boolean>;
export type SchedulePreviewOutputSync = (task: PreviewOutputSyncTask) => void;

export type AppPreviewOutputSyncTaskRequest = Omit<
  AppPreviewOutputSyncRequestInput,
  'originalInput' | 'fallbackContext' | 'signal'
>;

export interface AppPreviewOutputSyncTaskInput {
  request: AppPreviewOutputSyncTaskRequest;
  refs: {
    inputRef: MutableValueRef<string>;
    fallbackContextRef: MutableValueRef<TransformContext | null>;
    pendingOutputValue: MutableValueRef<string>;
  };
  applyEffects: {
    setPreviewValidation: (validation: ValidationResult) => void;
    onSetInput: (value: string) => void;
    onUpdateActiveFileContent: (value: string) => void;
  };
}

export type AppPreviewOutputSyncTaskRefs = AppPreviewOutputSyncTaskInput['refs'];
export type AppPreviewOutputSyncTaskApplyEffects = AppPreviewOutputSyncTaskInput['applyEffects'];

export type AppPreviewOutputChangeTaskInput = AppPreviewOutputSyncTaskInput & {
  scheduleOutputSync: SchedulePreviewOutputSync;
};
