import { useCallback, useState, type MutableRefObject } from 'react';
import type { AppSourceReplacePlan } from '../utils/appSourceReplacePlans';
import {
  cancelPendingSourceReplacement,
  confirmPendingSourceReplacement,
  isSameSourceReplacementTarget,
  runSourceReplacePlan,
  SOURCE_REPLACEMENT_STALE_MESSAGE,
} from '../utils/appSourceReplacementCommandHelpers';
import type {
  AppSourceReplacementTarget,
  AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandTypes';
import { showError } from '../utils/toast';

interface PendingSourceReplacementRequestOptions {
  startedAt?: number;
  target?: AppSourceReplacementTarget;
  onSuccessSkip?: () => void;
  shouldTrackConfirmAsSkipped?: boolean;
}

interface PendingSourceReplacement {
  text: string;
  target: AppSourceReplacementTarget;
}

interface UsePendingSourceReplacementCommandInput {
  eventName: string;
  category: string;
  confirmSuccessMessage: string;
  sourceTargetRef: MutableRefObject<AppSourceReplacementTarget>;
  onApply: (text: string, successMessage: string) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const usePendingSourceReplacementCommand = ({
  eventName,
  category,
  confirmSuccessMessage,
  sourceTargetRef,
  onApply,
  onTrackToolEvent,
}: UsePendingSourceReplacementCommandInput) => {
  const [pendingRequest, setPendingRequest] = useState<PendingSourceReplacement | null>(null);

  const reportStaleTarget = useCallback((startedAt: number) => {
    showError(SOURCE_REPLACEMENT_STALE_MESSAGE);
    onTrackToolEvent(eventName, category, 'skipped', startedAt);
  }, [category, eventName, onTrackToolEvent]);

  const handleRequest = useCallback((
    plan: AppSourceReplacePlan,
    options: PendingSourceReplacementRequestOptions = {},
  ) => {
    const startedAt = options.startedAt ?? performance.now();
    const target = options.target ?? sourceTargetRef.current;
    if (!isSameSourceReplacementTarget(sourceTargetRef.current, target)) {
      reportStaleTarget(startedAt);
      return;
    }

    if (pendingRequest !== null) setPendingRequest(null);
    runSourceReplacePlan({
      plan,
      eventName,
      category,
      startedAt,
      onApply,
      onConfirm: text => setPendingRequest({ text, target }),
      onTrackToolEvent,
      onSuccessSkip: options.onSuccessSkip,
      shouldTrackConfirmAsSkipped: options.shouldTrackConfirmAsSkipped,
    });
  }, [category, eventName, onApply, onTrackToolEvent, pendingRequest, reportStaleTarget, sourceTargetRef]);

  const handleConfirm = useCallback(() => {
    if (pendingRequest === null) return;
    if (!isSameSourceReplacementTarget(sourceTargetRef.current, pendingRequest.target)) {
      setPendingRequest(null);
      reportStaleTarget(performance.now());
      return;
    }

    confirmPendingSourceReplacement({
      pendingText: pendingRequest.text,
      successMessage: confirmSuccessMessage,
      eventName,
      category,
      onApply,
      onClearPending: () => setPendingRequest(null),
      onTrackToolEvent,
    });
  }, [
    category,
    confirmSuccessMessage,
    eventName,
    onApply,
    onTrackToolEvent,
    pendingRequest,
    reportStaleTarget,
    sourceTargetRef,
  ]);

  const handleCancel = useCallback(() => {
    cancelPendingSourceReplacement(eventName, category, () => {
      setPendingRequest(null);
    }, onTrackToolEvent);
  }, [category, eventName, onTrackToolEvent]);

  return {
    pendingText: pendingRequest?.text ?? null,
    handleRequest,
    handleConfirm,
    handleCancel,
  };
};
