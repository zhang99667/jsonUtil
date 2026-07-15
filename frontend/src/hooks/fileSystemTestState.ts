import type { FileTab } from '../types';
import type { WorkspaceFileTabState } from './useWorkspaceFileTabState';

export type WorkspaceStateUpdate = WorkspaceFileTabState
  | ((current: WorkspaceFileTabState) => WorkspaceFileTabState);

export const createWorkspaceFileTabState = (
  files: FileTab[],
  activeFileId: string | null,
): WorkspaceFileTabState => ({
  files,
  activeFileId,
});

export const applyWorkspaceStateUpdate = (
  current: WorkspaceFileTabState,
  update: WorkspaceStateUpdate,
) => typeof update === 'function' ? update(current) : update;

export const reduceWorkspaceStateUpdates = (
  initialState: WorkspaceFileTabState,
  updates: WorkspaceStateUpdate[],
) => updates.reduce<WorkspaceFileTabState>(
  (current, update) => applyWorkspaceStateUpdate(current, update),
  initialState,
);
