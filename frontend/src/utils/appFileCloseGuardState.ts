import type { FileTab } from '../types';

interface AppFileUnsavedChangesInput {
  files: FileTab[];
  activeFileId: string | null;
  sourceText: string;
}

export type AppFileCloseDecision =
  | { action: 'close'; fileId: string }
  | { action: 'confirm'; fileId: string }
  | { action: 'ignore' };

export const hasAppFileUnsavedChanges = ({
  files,
  activeFileId,
  sourceText,
}: AppFileUnsavedChangesInput): boolean => (
  files.some(file => file.isDirty) || (!activeFileId && sourceText.trim().length > 0)
);

export const getPendingAppCloseFile = (
  files: FileTab[],
  pendingCloseFileId: string | null
): FileTab | null => (
  pendingCloseFileId ? files.find(file => file.id === pendingCloseFileId) || null : null
);

export const buildAppFileCloseDecision = (
  files: FileTab[],
  fileId: string
): AppFileCloseDecision => {
  const fileToClose = files.find(file => file.id === fileId);
  if (!fileToClose) return { action: 'ignore' };

  if (fileToClose.isDirty) {
    return { action: 'confirm', fileId };
  }

  return { action: 'close', fileId };
};
