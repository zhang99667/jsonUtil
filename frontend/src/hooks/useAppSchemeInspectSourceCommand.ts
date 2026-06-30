import { useCallback } from 'react';
import { buildSchemeInspectSourcePlan } from '../utils/appSourceReplacePlans';
import type { AppSourceReplacementTrackEvent } from '../utils/appSourceReplacementCommandHelpers';
import { usePendingSourceReplacementCommand } from './usePendingSourceReplacementCommand';

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
  const {
    pendingText: pendingSchemeInspectSourceText,
    handleRequest: requestSchemeInspectSource,
    handleConfirm: handleConfirmSchemeInspectSource,
    handleCancel: handleCancelSchemeInspectSource,
  } = usePendingSourceReplacementCommand({
    eventName: 'SCHEME_INSPECT_SOURCE',
    category: 'panel',
    confirmSuccessMessage: '已用 Scheme 原始值替换 SOURCE 并开始排查',
    onApply,
    onTrackToolEvent,
  });

  const handleInspectSourceFromScheme = useCallback((value: string) => {
    requestSchemeInspectSource(buildSchemeInspectSourcePlan(sourceText, value), {
      startedAt: performance.now(),
      onSuccessSkip,
      shouldTrackConfirmAsSkipped: true,
    });
  }, [onSuccessSkip, requestSchemeInspectSource, sourceText]);

  return {
    pendingSchemeInspectSourceText,
    handleInspectSourceFromScheme,
    handleConfirmSchemeInspectSource,
    handleCancelSchemeInspectSource,
  };
};
