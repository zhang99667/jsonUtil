import { useCallback, useState } from 'react';
import type { AppSourceReplacePlan } from '../utils/appSourceReplacePlans';
import {
  cancelPendingSourceReplacement,
  confirmPendingSourceReplacement,
  runSourceReplacePlan,
  type AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandHelpers';

interface PendingSourceReplacementRequestOptions {
  startedAt?: number;
  onSuccessSkip?: () => void;
  shouldTrackConfirmAsSkipped?: boolean;
}

interface UsePendingSourceReplacementCommandInput {
  eventName: string;
  category: string;
  confirmSuccessMessage: string;
  onApply: (text: string, successMessage: string) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const usePendingSourceReplacementCommand = ({
  eventName,
  category,
  confirmSuccessMessage,
  onApply,
  onTrackToolEvent,
}: UsePendingSourceReplacementCommandInput) => {
  const [pendingText, setPendingText] = useState<string | null>(null);

  const handleRequest = useCallback((
    plan: AppSourceReplacePlan,
    options: PendingSourceReplacementRequestOptions = {},
  ) => {
    runSourceReplacePlan({
      plan,
      eventName,
      category,
      startedAt: options.startedAt ?? performance.now(),
      onApply,
      onConfirm: setPendingText,
      onTrackToolEvent,
      onSuccessSkip: options.onSuccessSkip,
      shouldTrackConfirmAsSkipped: options.shouldTrackConfirmAsSkipped,
    });
  }, [category, eventName, onApply, onTrackToolEvent]);

  const handleConfirm = useCallback(() => {
    confirmPendingSourceReplacement({
      pendingText,
      successMessage: confirmSuccessMessage,
      eventName,
      category,
      onApply,
      onClearPending: () => setPendingText(null),
      onTrackToolEvent,
    });
  }, [category, confirmSuccessMessage, eventName, onApply, onTrackToolEvent, pendingText]);

  const handleCancel = useCallback(() => {
    cancelPendingSourceReplacement(eventName, category, () => {
      setPendingText(null);
    }, onTrackToolEvent);
  }, [category, eventName, onTrackToolEvent]);

  return {
    pendingText,
    handleRequest,
    handleConfirm,
    handleCancel,
  };
};
