import { useCallback } from 'react';
import { getClipboardErrorMessage, readClipboardText } from '../utils/clipboard';
import { buildPasteSourcePlan } from '../utils/appSourceReplacePlans';
import { showError } from '../utils/toast';
import type { AppSourceReplacementTrackEvent } from '../utils/appSourceReplacementCommandHelpers';
import { usePendingSourceReplacementCommand } from './usePendingSourceReplacementCommand';

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
  const {
    pendingText: pendingPasteSourceText,
    handleRequest: requestPasteSource,
    handleConfirm: handleConfirmPasteSource,
    handleCancel: handleCancelPasteSource,
  } = usePendingSourceReplacementCommand({
    eventName: 'SOURCE_PASTE',
    category: 'editor',
    confirmSuccessMessage: '已用剪贴板内容替换 SOURCE',
    onApply,
    onTrackToolEvent,
  });

  const handlePasteSource = useCallback(async () => {
    const startedAt = performance.now();

    try {
      const clipboardText = await readClipboardText();
      requestPasteSource(
        buildPasteSourcePlan(sourceText, clipboardText),
        { startedAt },
      );
    } catch (error) {
      showError(getClipboardErrorMessage(error, '读取剪贴板失败'));
      onTrackToolEvent('SOURCE_PASTE', 'editor', 'error', startedAt);
    }
  }, [onTrackToolEvent, requestPasteSource, sourceText]);

  return {
    pendingPasteSourceText,
    handlePasteSource,
    handleConfirmPasteSource,
    handleCancelPasteSource,
  };
};
