import { useEffect, useRef } from 'react';

interface UseAppPreviewDraftFileChangeResetOptions {
  activeFileId: string | null;
  onCancelOutputDraft: () => void;
}

export const useAppPreviewDraftFileChangeReset = ({
  activeFileId,
  onCancelOutputDraft,
}: UseAppPreviewDraftFileChangeResetOptions): void => {
  const lastPreviewDraftFileIdRef = useRef(activeFileId);

  useEffect(() => {
    if (lastPreviewDraftFileIdRef.current === activeFileId) return;

    lastPreviewDraftFileIdRef.current = activeFileId;
    onCancelOutputDraft();
  }, [activeFileId, onCancelOutputDraft]);
};
