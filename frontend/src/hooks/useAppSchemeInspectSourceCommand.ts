import { useCallback, type MutableRefObject } from 'react';
import { buildSchemeInspectSourcePlan } from '../utils/appSourceReplacePlans';
import type {
  AppSourceReplacementTarget,
  AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandTypes';
import { usePendingSourceReplacementCommand } from './usePendingSourceReplacementCommand';

interface UseAppSchemeInspectSourceCommandInput {
  sourceTargetRef: MutableRefObject<AppSourceReplacementTarget>;
  onApply: (text: string, successMessage: string) => void;
  onSuccessSkip: () => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppSchemeInspectSourceCommand = ({
  sourceTargetRef,
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
    sourceTargetRef,
    onApply,
    onTrackToolEvent,
  });

  const handleInspectSourceFromScheme = useCallback((value: string) => {
    requestSchemeInspectSource(buildSchemeInspectSourcePlan(
      sourceTargetRef.current.sourceText,
      value,
    ), {
      startedAt: performance.now(),
      onSuccessSkip,
      shouldTrackConfirmAsSkipped: true,
    });
  }, [onSuccessSkip, requestSchemeInspectSource, sourceTargetRef]);

  return {
    pendingSchemeInspectSourceText,
    handleInspectSourceFromScheme,
    handleConfirmSchemeInspectSource,
    handleCancelSchemeInspectSource,
  };
};
