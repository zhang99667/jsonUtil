import { useCallback, useState } from 'react';
import { getClipboardErrorMessage, readClipboardText } from '../utils/clipboard';
import { buildPasteSourcePlan } from '../utils/appSourceReplacePlans';
import { showError } from '../utils/toast';
import {
  cancelPendingSourceReplacement,
  confirmPendingSourceReplacement,
  runSourceReplacePlan,
  type AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandHelpers';

interface UseAppPasteSourceCommandInput {
  sourceText: string;
  onApply: (text: string, successMessage: string) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppPasteSourceCommand = ({
  sourceText,
  onApply,
  onTrackToolEvent,
}: UseAppPasteSourceCommandInput) => {
  const [pendingPasteSourceText, setPendingPasteSourceText] = useState<string | null>(null);

  const handlePasteSource = useCallback(async () => {
    const startedAt = performance.now();

    try {
      const clipboardText = await readClipboardText();
      runSourceReplacePlan({
        plan: buildPasteSourcePlan(sourceText, clipboardText),
        eventName: 'SOURCE_PASTE',
        category: 'editor',
        startedAt,
        onApply,
        onConfirm: setPendingPasteSourceText,
        onTrackToolEvent,
      });
    } catch (error) {
      showError(getClipboardErrorMessage(error, '读取剪贴板失败'));
      onTrackToolEvent('SOURCE_PASTE', 'editor', 'error', startedAt);
    }
  }, [onApply, onTrackToolEvent, sourceText]);

  const handleConfirmPasteSource = useCallback(() => {
    confirmPendingSourceReplacement({
      pendingText: pendingPasteSourceText,
      successMessage: '已用剪贴板内容替换 SOURCE',
      eventName: 'SOURCE_PASTE',
      category: 'editor',
      onApply,
      onClearPending: () => setPendingPasteSourceText(null),
      onTrackToolEvent,
    });
  }, [onApply, onTrackToolEvent, pendingPasteSourceText]);

  const handleCancelPasteSource = useCallback(() => {
    cancelPendingSourceReplacement('SOURCE_PASTE', 'editor', () => {
      setPendingPasteSourceText(null);
    }, onTrackToolEvent);
  }, [onTrackToolEvent]);

  return {
    pendingPasteSourceText,
    handlePasteSource,
    handleConfirmPasteSource,
    handleCancelPasteSource,
  };
};
