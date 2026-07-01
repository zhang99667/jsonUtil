import { useCallback, useMemo, useState } from 'react';
import type { FileTab } from '../types';
import {
  buildAppFileCloseDecision,
  getPendingAppCloseFile,
  hasAppFileUnsavedChanges,
} from '../utils/appFileCloseGuardState';
import { useAppBeforeUnloadGuard } from './useAppBeforeUnloadGuard';

interface UseAppFileCloseGuardInput {
  files: FileTab[];
  activeFileId: string | null;
  sourceText: string;
  onCloseFile: (fileId: string) => void;
}

export const useAppFileCloseGuard = ({ files, activeFileId, sourceText, onCloseFile }: UseAppFileCloseGuardInput) => {
  const [pendingCloseFileId, setPendingCloseFileId] = useState<string | null>(null);
  const hasUnsavedChanges = useMemo(
    () => hasAppFileUnsavedChanges({ files, activeFileId, sourceText }),
    [activeFileId, files, sourceText]
  );
  const pendingCloseFile = useMemo(
    () => getPendingAppCloseFile(files, pendingCloseFileId),
    [files, pendingCloseFileId]
  );

  useAppBeforeUnloadGuard(hasUnsavedChanges);

  const requestCloseFile = useCallback((fileId: string) => {
    const decision = buildAppFileCloseDecision(files, fileId);

    if (decision.action === 'confirm') {
      setPendingCloseFileId(decision.fileId);
      return;
    }

    if (decision.action === 'close') {
      onCloseFile(decision.fileId);
    }
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

  return { cancelPendingCloseFile, confirmPendingCloseFile, hasUnsavedChanges, pendingCloseFile, requestCloseFile };
};
