import { useCallback, useState } from 'react';
import type { HighlightRange } from '../types';
import { showError, showSuccess } from '../utils/toast';
import type { AppSourceReplacementTrackEvent } from '../utils/appSourceReplacementCommandHelpers';

interface UseAppClearSourceCommandsInput {
  sourceText: string;
  onInputChange: (value: string) => void;
  onSetHighlightRange: (range: HighlightRange | null) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppClearSourceCommands = ({
  sourceText,
  onInputChange,
  onSetHighlightRange,
  onTrackToolEvent,
}: UseAppClearSourceCommandsInput) => {
  const [isClearSourceConfirmOpen, setIsClearSourceConfirmOpen] = useState(false);

  const handleRequestClearSource = useCallback(() => {
    const startedAt = performance.now();
    if (!sourceText.trim()) {
      showError('源内容已经是空的');
      onTrackToolEvent('SOURCE_CLEAR', 'editor', 'skipped', startedAt);
      return;
    }

    setIsClearSourceConfirmOpen(true);
  }, [onTrackToolEvent, sourceText]);

  const handleConfirmClearSource = useCallback(() => {
    const startedAt = performance.now();
    onInputChange('');
    onSetHighlightRange(null);
    setIsClearSourceConfirmOpen(false);
    showSuccess('源内容已清空');
    onTrackToolEvent('SOURCE_CLEAR', 'editor', 'success', startedAt);
  }, [onInputChange, onSetHighlightRange, onTrackToolEvent]);

  const handleCancelClearSource = useCallback(() => {
    setIsClearSourceConfirmOpen(false);
  }, []);

  return {
    isClearSourceConfirmOpen,
    handleRequestClearSource,
    handleConfirmClearSource,
    handleCancelClearSource,
  };
};
