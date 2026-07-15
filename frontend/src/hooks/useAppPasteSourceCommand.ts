import { useCallback, type MutableRefObject } from 'react';
import { getClipboardErrorMessage, readClipboardText } from '../utils/clipboard';
import { buildPasteSourcePlan } from '../utils/appSourceReplacePlans';
import { showError } from '../utils/toast';
import type {
  AppSourceReplacementTarget,
  AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandTypes';
import { usePendingSourceReplacementCommand } from './usePendingSourceReplacementCommand';

interface UseAppPasteSourceCommandInput {
  sourceTargetRef: MutableRefObject<AppSourceReplacementTarget>;
  onApply: (text: string, successMessage: string) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppPasteSourceCommand = ({
  sourceTargetRef,
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
    sourceTargetRef,
    onApply,
    onTrackToolEvent,
  });

  const handlePasteSource = useCallback(async () => {
    const startedAt = performance.now();
    const target = sourceTargetRef.current;

    try {
      const clipboardText = await readClipboardText();
      requestPasteSource(
        buildPasteSourcePlan(target.sourceText, clipboardText),
        { startedAt, target },
      );
    } catch (error) {
      showError(getClipboardErrorMessage(error, '读取剪贴板失败'));
      onTrackToolEvent('SOURCE_PASTE', 'editor', 'error', startedAt);
    }
  }, [onTrackToolEvent, requestPasteSource, sourceTargetRef]);

  return {
    pendingPasteSourceText,
    handlePasteSource,
    handleConfirmPasteSource,
    handleCancelPasteSource,
  };
};
