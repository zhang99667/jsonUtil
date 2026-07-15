import type { FileTab } from '../types';

export const markWorkspaceFileSnapshotSaved = (
  file: FileTab,
  savedContent: string,
  content = file.content,
): FileTab => ({
  ...file,
  content,
  savedContent,
  isDirty: content !== savedContent,
});
