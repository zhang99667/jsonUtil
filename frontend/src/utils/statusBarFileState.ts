import type { FileTab } from '../types';
import {
  getStatusBarSaveStatus,
  type StatusBarBadgeState,
} from './statusBarState';

interface StatusBarFileStateInput {
  activeFileId: string | null;
  files: FileTab[];
  inputLength: number;
  isAutoSaveEnabled: boolean;
}

export interface StatusBarFileState {
  activeFile: FileTab | null;
  saveStatus: StatusBarBadgeState;
}

export const getStatusBarActiveFile = (
  activeFileId: string | null,
  files: FileTab[],
): FileTab | null => (
  activeFileId ? files.find(file => file.id === activeFileId) ?? null : null
);

export const buildStatusBarFileState = ({
  activeFileId,
  files,
  inputLength,
  isAutoSaveEnabled,
}: StatusBarFileStateInput): StatusBarFileState => {
  const activeFile = getStatusBarActiveFile(activeFileId, files);

  return {
    activeFile,
    saveStatus: getStatusBarSaveStatus({
      hasActiveFile: Boolean(activeFile),
      isSavedFile: Boolean(activeFile?.handle),
      isDirty: Boolean(activeFile?.isDirty),
      inputLength,
      isAutoSaveEnabled,
    }),
  };
};
