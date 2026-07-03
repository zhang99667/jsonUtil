import { useEffect, useRef } from 'react';

interface UseAppPreviewDraftFileChangeResetOptions {
  activeFileId: string | null;
  onCancelOutputDraft: () => void;
}

export const shouldCancelPreviewDraftOnFileChange = (previousFileId: string | null, nextFileId: string | null): boolean =>
  previousFileId !== nextFileId;

export const useAppPreviewDraftFileChangeReset = ({
  activeFileId,
  onCancelOutputDraft,
}: UseAppPreviewDraftFileChangeResetOptions): void => {
  const lastPreviewDraftFileIdRef = useRef(activeFileId);

  useEffect(() => {
    if (!shouldCancelPreviewDraftOnFileChange(lastPreviewDraftFileIdRef.current, activeFileId)) return;

    lastPreviewDraftFileIdRef.current = activeFileId;
    onCancelOutputDraft();
  }, [activeFileId, onCancelOutputDraft]);
};
