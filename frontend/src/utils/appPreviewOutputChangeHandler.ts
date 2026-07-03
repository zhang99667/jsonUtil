import { beginPreviewOutputDraft } from './appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import type { AppPreviewOutputSyncTaskInput } from './appPreviewOutputSyncTaskTypes';
import type { MutableValueRef } from './mutableValueRef';

type PreviewOutputSyncTask = (isCurrent: () => boolean) => Promise<boolean>;

export interface AppPreviewOutputChangeHandlerInput
  extends Omit<AppPreviewOutputSyncTaskInput, 'previewText'> {
  isUpdatingFromOutput: MutableValueRef<boolean>;
  updatePreviewValidation: (previewText: string) => void;
  scheduleOutputSync: (task: PreviewOutputSyncTask) => void;
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
