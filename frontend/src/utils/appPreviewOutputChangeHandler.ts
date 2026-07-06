import { beginPreviewOutputDraft } from './appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import type {
  AppPreviewOutputSyncTaskApplyEffects,
  AppPreviewOutputSyncTaskRefs,
  AppPreviewOutputSyncTaskRequest,
  SchedulePreviewOutputSync,
} from './appPreviewOutputSyncTaskTypes';
import type { MutableValueRef } from './mutableValueRef';

export interface AppPreviewOutputChangeHandlerInput
  extends Omit<AppPreviewOutputSyncTaskRequest, 'previewText'>,
    AppPreviewOutputSyncTaskRefs,
    AppPreviewOutputSyncTaskApplyEffects {
  isUpdatingFromOutput: MutableValueRef<boolean>;
  updatePreviewValidation: (previewText: string) => void;
  scheduleOutputSync: SchedulePreviewOutputSync;
}

interface RunAppPreviewOutputChangeInput
  extends AppPreviewOutputChangeHandlerInput {
  previewText: string;
}

export const runAppPreviewOutputChange = ({
  previewText,
  isUpdatingFromOutput,
  pendingOutputValue,
  updatePreviewValidation,
  scheduleOutputSync,
  ...taskInput
}: RunAppPreviewOutputChangeInput) => {
  beginPreviewOutputDraft(isUpdatingFromOutput, pendingOutputValue, previewText);
  updatePreviewValidation(previewText);
  scheduleAppPreviewOutputChangeTask({
    ...taskInput,
    previewText,
    pendingOutputValue,
    scheduleOutputSync,
  });
};
