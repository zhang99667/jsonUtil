import { createAppPreviewOutputSyncTask } from './appPreviewOutputSyncTask';
import type { AppPreviewOutputChangeTaskInput } from './appPreviewOutputSyncTaskTypes';

export const scheduleAppPreviewOutputChangeTask = ({
  scheduleOutputSync,
  ...syncInput
}: AppPreviewOutputChangeTaskInput) => {
  scheduleOutputSync(createAppPreviewOutputSyncTask(syncInput));
};
