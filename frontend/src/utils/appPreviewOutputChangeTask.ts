import { createAppPreviewOutputSyncTask } from './appPreviewOutputSyncTask';
import type { AppPreviewOutputSyncTaskInput } from './appPreviewOutputSyncTaskTypes';

type PreviewOutputSyncTask = (isCurrent: () => boolean) => Promise<boolean>;

interface AppPreviewOutputChangeTaskInput extends AppPreviewOutputSyncTaskInput {
  scheduleOutputSync: (task: PreviewOutputSyncTask) => void;
}

export const scheduleAppPreviewOutputChangeTask = ({
  scheduleOutputSync,
  ...taskInput
}: AppPreviewOutputChangeTaskInput) => {
  scheduleOutputSync(createAppPreviewOutputSyncTask(taskInput));
};
