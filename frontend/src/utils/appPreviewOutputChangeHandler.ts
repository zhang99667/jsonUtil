import { beginPreviewOutputDraft } from './appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import type {
  AppPreviewOutputSyncTaskApplyEffects,
  AppPreviewOutputSyncTaskInput,
  AppPreviewOutputSyncTaskRefs,
  AppPreviewOutputSyncTaskRequest,
  SchedulePreviewOutputSync,
} from './appPreviewOutputSyncTaskTypes';
import type { MutableValueRef } from './mutableValueRef';

export interface AppPreviewOutputChangeHandlerInput {
  request: Omit<AppPreviewOutputSyncTaskRequest, 'previewText'>;
  refs: AppPreviewOutputSyncTaskRefs;
  applyEffects: AppPreviewOutputSyncTaskApplyEffects;
  isUpdatingFromOutput: MutableValueRef<boolean>;
  updatePreviewValidation: (previewText: string) => void;
  scheduleOutputSync: SchedulePreviewOutputSync;
}

export interface RunAppPreviewOutputChangeInput extends AppPreviewOutputSyncTaskInput {
  isUpdatingFromOutput: MutableValueRef<boolean>;
  updatePreviewValidation: (previewText: string) => void;
  scheduleOutputSync: SchedulePreviewOutputSync;
}

export const runAppPreviewOutputChange = ({
  request,
  refs,
  applyEffects,
  isUpdatingFromOutput,
  updatePreviewValidation,
  scheduleOutputSync,
}: RunAppPreviewOutputChangeInput) => {
  const { previewText } = request;
  beginPreviewOutputDraft(isUpdatingFromOutput, refs.pendingOutputValue, previewText);
  updatePreviewValidation(previewText);
  scheduleAppPreviewOutputChangeTask({
    request,
    refs,
    applyEffects,
    scheduleOutputSync,
  });
};
