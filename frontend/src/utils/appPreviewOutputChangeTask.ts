import { createAppPreviewOutputSyncTask } from './appPreviewOutputSyncTask';
import type { AppPreviewOutputChangeTaskInput } from './appPreviewOutputSyncTaskTypes';

export const scheduleAppPreviewOutputChangeTask = ({
  scheduleOutputSync,
  previewText, files, activeFileId, mode, validateJsonMaybeAsync,
  inputRef, fallbackContextRef, pendingOutputValue,
  setPreviewValidation, onSetInput, onUpdateActiveFileContent,
}: AppPreviewOutputChangeTaskInput) => {
  scheduleOutputSync(createAppPreviewOutputSyncTask({
    request: { previewText, files, activeFileId, mode, validateJsonMaybeAsync },
    refs: { inputRef, fallbackContextRef, pendingOutputValue },
    applyEffects: { setPreviewValidation, onSetInput, onUpdateActiveFileContent },
  }));
};
