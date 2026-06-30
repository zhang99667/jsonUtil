import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FileTab } from '../types';

interface UseAppFileCloseGuardInput {
  files: FileTab[];
  activeFileId: string | null;
  sourceText: string;
  onCloseFile: (fileId: string) => void;
}

export const useAppFileCloseGuard = ({
  files,
  activeFileId,
  sourceText,
  onCloseFile,
}: UseAppFileCloseGuardInput) => {
  const [pendingCloseFileId, setPendingCloseFileId] = useState<string | null>(null);
  const hasUnsavedChanges = useMemo(() => {
    if (files.some(file => file.isDirty)) {
      return true;
    }

    return !activeFileId && sourceText.trim().length > 0;
  }, [activeFileId, files, sourceText]);
  const pendingCloseFile = useMemo(
    () => pendingCloseFileId ? files.find(file => file.id === pendingCloseFileId) || null : null,
    [files, pendingCloseFileId]
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const requestCloseFile = useCallback((fileId: string) => {
    const fileToClose = files.find(file => file.id === fileId);
    if (!fileToClose) return;

    if (fileToClose.isDirty) {
      setPendingCloseFileId(fileId);
      return;
    }

    onCloseFile(fileId);
  }, [files, onCloseFile]);

  const cancelPendingCloseFile = useCallback(() => {
    setPendingCloseFileId(null);
  }, []);

  const confirmPendingCloseFile = useCallback(() => {
    if (pendingCloseFileId) {
      onCloseFile(pendingCloseFileId);
    }
    setPendingCloseFileId(null);
  }, [onCloseFile, pendingCloseFileId]);

  return {
    cancelPendingCloseFile,
    confirmPendingCloseFile,
    hasUnsavedChanges,
    pendingCloseFile,
    requestCloseFile,
  };
};
