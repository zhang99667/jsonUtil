import { describe, expect, it, vi } from 'vitest';
import { createAppPreviewOutputSyncTask } from './appPreviewOutputSyncTask';
import { scheduleAppPreviewOutputChangeTask } from './appPreviewOutputChangeTask';
import {
  buildExpectedPreviewOutputSyncTaskInput,
  createPreviewOutputChangeTaskInput,
} from './appPreviewOutputSyncTestFixture';

const syncTask = vi.hoisted(() => vi.fn());

vi.mock('./appPreviewOutputSyncTask', async importOriginal => ({
  ...await importOriginal<typeof import('./appPreviewOutputSyncTask')>(),
  createAppPreviewOutputSyncTask: vi.fn(() => syncTask),
}));

describe('appPreviewOutputChangeTask', () => {
  it('创建 PREVIEW 同步任务并交给 scheduler', () => {
    const input = createPreviewOutputChangeTaskInput();

    scheduleAppPreviewOutputChangeTask(input);

    expect(createAppPreviewOutputSyncTask).toHaveBeenCalledWith(
      buildExpectedPreviewOutputSyncTaskInput(input)
    );
    expect(input.scheduleOutputSync).toHaveBeenCalledWith(syncTask);
  });
});
