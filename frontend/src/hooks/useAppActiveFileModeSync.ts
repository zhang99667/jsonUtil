import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { FileTab, TransformMode } from '../types';

export interface UseAppActiveFileModeSyncOptions {
  activeFileId: string | null;
  mode: TransformMode;
  onSetFiles: Dispatch<SetStateAction<FileTab[]>>;
}

export const useAppActiveFileModeSync = ({
  activeFileId,
  mode,
  onSetFiles,
}: UseAppActiveFileModeSyncOptions): void => {
  useEffect(() => {
    if (!activeFileId) return;

    onSetFiles(prev => prev.map(file => (
      file.id === activeFileId ? { ...file, mode } : file
    )));
  }, [activeFileId, mode, onSetFiles]);
};
