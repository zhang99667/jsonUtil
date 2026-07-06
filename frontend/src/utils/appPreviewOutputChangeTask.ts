import { createAppPreviewOutputSyncTask } from './appPreviewOutputSyncTask';
import type {
  AppPreviewOutputSyncTaskApplyEffects,
  AppPreviewOutputSyncTaskRefs,
  AppPreviewOutputSyncTaskRequest,
  PreviewOutputSyncTask,
} from './appPreviewOutputSyncTaskTypes';

export type AppPreviewOutputChangeTaskInput = AppPreviewOutputSyncTaskRequest
  & AppPreviewOutputSyncTaskRefs
  & AppPreviewOutputSyncTaskApplyEffects
  & { scheduleOutputSync: (task: PreviewOutputSyncTask) => void };

export const scheduleAppPreviewOutputChangeTask = ({
  scheduleOutputSync,
  inputRef,
  fallbackContextRef,
  pendingOutputValue,
  setPreviewValidation,
  onSetInput,
  onUpdateActiveFileContent,
  ...request
}: AppPreviewOutputChangeTaskInput) => {
  scheduleOutputSync(createAppPreviewOutputSyncTask({
    request,
    refs: { inputRef, fallbackContextRef, pendingOutputValue },
    applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
  }));
};
