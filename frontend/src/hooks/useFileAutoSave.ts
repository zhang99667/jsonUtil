import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import toast from 'react-hot-toast';
import type { FileTab } from '../types';
import { writeTextToFileHandleQueued } from '../utils/browserFileHandleWrite';
import { getDetailedErrorMessage } from '../utils/errors';
import { markWorkspaceFileSnapshotSaved } from '../utils/workspaceFileSaveState';

interface UseFileAutoSaveOptions {
  activeFile?: FileTab;
  input: string;
  isEnabled: boolean;
  setFiles: Dispatch<SetStateAction<FileTab[]>>;
}

export const FILE_AUTO_SAVE_DEBOUNCE_MS = 1000;

export const useFileAutoSave = ({ activeFile, input, isEnabled, setFiles }: UseFileAutoSaveOptions) => {
  const fileId = activeFile?.id;
  const handle = activeFile?.handle;
  const savedContent = activeFile?.savedContent ?? '';
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingAutoSave = useCallback(() => {
    if (pendingTimerRef.current === null) return;
    clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = null;
  }, []);

  useEffect(() => {
    cancelPendingAutoSave();
    if (!isEnabled || !fileId || !handle || input === savedContent) return;

    const timer = setTimeout(async () => {
      pendingTimerRef.current = null;
      const snapshot = input;
      try {
        await writeTextToFileHandleQueued(handle, snapshot);
        setFiles(files => files.map(file => (
          file.id === fileId && file.handle === handle
            ? markWorkspaceFileSnapshotSaved(file, snapshot)
            : file
        )));
      } catch (error) {
        console.error('自动保存失败:', error);
        toast.error(getDetailedErrorMessage(error, '自动保存失败'), { duration: 3000 });
      }
    }, FILE_AUTO_SAVE_DEBOUNCE_MS);
    pendingTimerRef.current = timer;

    return cancelPendingAutoSave;
  }, [cancelPendingAutoSave, fileId, handle, input, isEnabled, savedContent, setFiles]);

  return cancelPendingAutoSave;
};
