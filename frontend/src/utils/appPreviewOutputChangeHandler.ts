import { beginPreviewOutputDraft } from './appPreviewOutputDraft';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import type {
  AppPreviewOutputSyncTaskApplyEffects,
  AppPreviewOutputSyncTaskRefs,
  AppPreviewOutputSyncTaskRequest,
} from './appPreviewOutputSyncTaskTypes';
import type { MutableValueRef } from './mutableValueRef';

type PreviewOutputSyncTask = (isCurrent: () => boolean) => Promise<boolean>;

export interface AppPreviewOutputChangeHandlerInput
  extends Omit<AppPreviewOutputSyncTaskRequest, 'previewText'>,
    AppPreviewOutputSyncTaskRefs,
    AppPreviewOutputSyncTaskApplyEffects {
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
