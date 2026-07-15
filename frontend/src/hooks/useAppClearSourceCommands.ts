import { useCallback, useState, type MutableRefObject } from 'react';
import type { HighlightRange } from '../types';
import {
  isSameSourceReplacementTarget,
  SOURCE_REPLACEMENT_STALE_MESSAGE,
} from '../utils/appSourceReplacementCommandHelpers';
import { showError, showSuccess } from '../utils/toast';
import type {
  AppSourceReplacementTarget,
  AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandTypes';

interface UseAppClearSourceCommandsInput {
  sourceTargetRef: MutableRefObject<AppSourceReplacementTarget>;
  onInputChange: (value: string) => void;
  onSetHighlightRange: (range: HighlightRange | null) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppClearSourceCommands = ({
  sourceTargetRef,
  onInputChange,
  onSetHighlightRange,
  onTrackToolEvent,
}: UseAppClearSourceCommandsInput) => {
  const [pendingClearTarget, setPendingClearTarget] =
    useState<AppSourceReplacementTarget | null>(null);

  const handleRequestClearSource = useCallback(() => {
    const startedAt = performance.now();
    const target = sourceTargetRef.current;
    if (!target.sourceText.trim()) {
      showError('源内容已经是空的');
      onTrackToolEvent('SOURCE_CLEAR', 'editor', 'skipped', startedAt);
      return;
    }

    setPendingClearTarget(target);
  }, [onTrackToolEvent, sourceTargetRef]);

  const handleConfirmClearSource = useCallback(() => {
    if (pendingClearTarget === null) return;
    const startedAt = performance.now();
    if (!isSameSourceReplacementTarget(sourceTargetRef.current, pendingClearTarget)) {
      setPendingClearTarget(null);
      showError(SOURCE_REPLACEMENT_STALE_MESSAGE);
      onTrackToolEvent('SOURCE_CLEAR', 'editor', 'skipped', startedAt);
      return;
    }

    onInputChange('');
    onSetHighlightRange(null);
    setPendingClearTarget(null);
    showSuccess('源内容已清空');
    onTrackToolEvent('SOURCE_CLEAR', 'editor', 'success', startedAt);
  }, [
    onInputChange,
    onSetHighlightRange,
    onTrackToolEvent,
    pendingClearTarget,
    sourceTargetRef,
  ]);

  const handleCancelClearSource = useCallback(() => {
    setPendingClearTarget(null);
  }, []);

  return {
    isClearSourceConfirmOpen: pendingClearTarget !== null,
    handleRequestClearSource,
    handleConfirmClearSource,
    handleCancelClearSource,
  };
};
