import { useCallback, useState } from 'react';
import { buildSchemeInspectSourcePlan } from '../utils/appSourceReplacePlans';
import {
  cancelPendingSourceReplacement,
  confirmPendingSourceReplacement,
  runSourceReplacePlan,
  type AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandHelpers';

interface UseAppSchemeInspectSourceCommandInput {
  sourceText: string;
  onApply: (text: string, successMessage: string) => void;
  onSuccessSkip: () => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppSchemeInspectSourceCommand = ({
  sourceText,
  onApply,
  onSuccessSkip,
  onTrackToolEvent,
}: UseAppSchemeInspectSourceCommandInput) => {
  const [pendingSchemeInspectSourceText, setPendingSchemeInspectSourceText] = useState<string | null>(null);

  const handleInspectSourceFromScheme = useCallback((value: string) => {
    const startedAt = performance.now();
    runSourceReplacePlan({
      plan: buildSchemeInspectSourcePlan(sourceText, value),
      eventName: 'SCHEME_INSPECT_SOURCE',
      category: 'panel',
      startedAt,
      onApply,
      onConfirm: setPendingSchemeInspectSourceText,
      onSuccessSkip,
      onTrackToolEvent,
      shouldTrackConfirmAsSkipped: true,
    });
  }, [onApply, onSuccessSkip, onTrackToolEvent, sourceText]);

  const handleConfirmSchemeInspectSource = useCallback(() => {
    confirmPendingSourceReplacement({
      pendingText: pendingSchemeInspectSourceText,
      successMessage: '已用 Scheme 原始值替换 SOURCE 并开始排查',
      eventName: 'SCHEME_INSPECT_SOURCE',
      category: 'panel',
      onApply,
      onClearPending: () => setPendingSchemeInspectSourceText(null),
      onTrackToolEvent,
    });
  }, [onApply, onTrackToolEvent, pendingSchemeInspectSourceText]);

  const handleCancelSchemeInspectSource = useCallback(() => {
    cancelPendingSourceReplacement('SCHEME_INSPECT_SOURCE', 'panel', () => {
      setPendingSchemeInspectSourceText(null);
    }, onTrackToolEvent);
  }, [onTrackToolEvent]);

  return {
    pendingSchemeInspectSourceText,
    handleInspectSourceFromScheme,
    handleConfirmSchemeInspectSource,
    handleCancelSchemeInspectSource,
  };
};
