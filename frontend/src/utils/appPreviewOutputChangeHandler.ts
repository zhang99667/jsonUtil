import { beginPreviewOutputDraft } from './appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import type {
  AppPreviewOutputSyncTaskInput,
  AppPreviewOutputSyncTaskRequest,
  SchedulePreviewOutputSync,
} from './appPreviewOutputSyncTaskTypes';
import type { MutableValueRef } from './mutableValueRef';

export type RunAppPreviewOutputChangeInput = AppPreviewOutputSyncTaskInput & {
  isUpdatingFromOutput: MutableValueRef<boolean>;
  updatePreviewValidation: (previewText: string) => void;
  scheduleOutputSync: SchedulePreviewOutputSync;
};

export type AppPreviewOutputChangeHandlerInput = Omit<RunAppPreviewOutputChangeInput, 'request'> & {
  request: Omit<AppPreviewOutputSyncTaskRequest, 'previewText'>;
};

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
