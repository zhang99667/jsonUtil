import { createAppPreviewOutputSyncTask } from './appPreviewOutputSyncTask';
import { buildAppPreviewOutputSyncTaskInput } from './appPreviewOutputSyncTaskInput';
import type { AppPreviewOutputChangeTaskInput } from './appPreviewOutputSyncTaskTypes';

export const scheduleAppPreviewOutputChangeTask = ({
  scheduleOutputSync,
  ...syncInput
}: AppPreviewOutputChangeTaskInput) => {
  scheduleOutputSync(createAppPreviewOutputSyncTask(
    buildAppPreviewOutputSyncTaskInput(syncInput)
  ));
};
