import { useCallback, type MutableRefObject } from 'react';
import {
  buildApplyPreviewToSourcePlan,
  buildApplySchemaExampleToSourcePlan,
} from '../utils/appSourceReplacePlans';
import type {
  AppSourceReplacementTarget,
  AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandTypes';
import { usePendingSourceReplacementCommand } from './usePendingSourceReplacementCommand';

interface UseAppApplySourceReplacementCommandsInput {
  sourceTargetRef: MutableRefObject<AppSourceReplacementTarget>;
  previewText: string;
  isOutputTransforming: boolean;
  onApply: (text: string, successMessage: string) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppApplySourceReplacementCommands = ({
  sourceTargetRef,
  previewText,
  isOutputTransforming,
  onApply,
  onTrackToolEvent,
}: UseAppApplySourceReplacementCommandsInput) => {
  const {
    pendingText: pendingApplyPreviewText,
    handleRequest: requestApplyPreviewToSource,
    handleConfirm: handleConfirmApplyPreviewToSource,
    handleCancel: handleCancelApplyPreviewToSource,
  } = usePendingSourceReplacementCommand({
    eventName: 'PREVIEW_APPLY_TO_SOURCE',
    category: 'editor',
    confirmSuccessMessage: '已用 PREVIEW 替换 SOURCE',
    sourceTargetRef,
    onApply,
    onTrackToolEvent,
  });
  const {
    pendingText: pendingSchemaExampleText,
    handleRequest: requestApplySchemaExampleToSource,
    handleConfirm: handleConfirmApplySchemaExampleToSource,
    handleCancel: handleCancelApplySchemaExampleToSource,
  } = usePendingSourceReplacementCommand({
    eventName: 'SCHEMA_EXAMPLE_APPLY_TO_SOURCE',
    category: 'schema',
    confirmSuccessMessage: '已用 Schema 示例替换 SOURCE',
    sourceTargetRef,
    onApply,
    onTrackToolEvent,
  });

  const handleRequestApplyPreviewToSource = useCallback(() => {
    requestApplyPreviewToSource(
      buildApplyPreviewToSourcePlan(
        sourceTargetRef.current.sourceText,
        previewText,
        isOutputTransforming,
      ),
      { startedAt: performance.now() },
    );
  }, [isOutputTransforming, previewText, requestApplyPreviewToSource, sourceTargetRef]);

  const handleRequestApplySchemaExampleToSource = useCallback((text: string) => {
    requestApplySchemaExampleToSource(
      buildApplySchemaExampleToSourcePlan(sourceTargetRef.current.sourceText, text),
      { startedAt: performance.now() },
    );
  }, [requestApplySchemaExampleToSource, sourceTargetRef]);

  return {
    pendingApplyPreviewText,
    pendingSchemaExampleText,
    handleRequestApplyPreviewToSource,
    handleConfirmApplyPreviewToSource,
    handleCancelApplyPreviewToSource,
    handleRequestApplySchemaExampleToSource,
    handleConfirmApplySchemaExampleToSource,
    handleCancelApplySchemaExampleToSource,
  };
};
