import { useCallback, useState } from 'react';
import {
  buildApplyPreviewToSourcePlan,
  buildApplySchemaExampleToSourcePlan,
} from '../utils/appSourceReplacePlans';
import {
  cancelPendingSourceReplacement,
  confirmPendingSourceReplacement,
  runSourceReplacePlan,
  type AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandHelpers';

interface UseAppApplySourceReplacementCommandsInput {
  sourceText: string;
  previewText: string;
  isOutputTransforming: boolean;
  onApply: (text: string, successMessage: string) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppApplySourceReplacementCommands = ({
  sourceText,
  previewText,
  isOutputTransforming,
  onApply,
  onTrackToolEvent,
}: UseAppApplySourceReplacementCommandsInput) => {
  const [pendingApplyPreviewText, setPendingApplyPreviewText] = useState<string | null>(null);
  const [pendingSchemaExampleText, setPendingSchemaExampleText] = useState<string | null>(null);

  const handleRequestApplyPreviewToSource = useCallback(() => {
    const startedAt = performance.now();
    runSourceReplacePlan({
      plan: buildApplyPreviewToSourcePlan(sourceText, previewText, isOutputTransforming),
      eventName: 'PREVIEW_APPLY_TO_SOURCE',
      category: 'editor',
      startedAt,
      onApply,
      onConfirm: setPendingApplyPreviewText,
      onTrackToolEvent,
    });
  }, [isOutputTransforming, onApply, onTrackToolEvent, previewText, sourceText]);

  const handleConfirmApplyPreviewToSource = useCallback(() => {
    confirmPendingSourceReplacement({
      pendingText: pendingApplyPreviewText,
      successMessage: '已用 PREVIEW 替换 SOURCE',
      eventName: 'PREVIEW_APPLY_TO_SOURCE',
      category: 'editor',
      onApply,
      onClearPending: () => setPendingApplyPreviewText(null),
      onTrackToolEvent,
    });
  }, [onApply, onTrackToolEvent, pendingApplyPreviewText]);

  const handleCancelApplyPreviewToSource = useCallback(() => {
    cancelPendingSourceReplacement('PREVIEW_APPLY_TO_SOURCE', 'editor', () => {
      setPendingApplyPreviewText(null);
    }, onTrackToolEvent);
  }, [onTrackToolEvent]);

  const handleRequestApplySchemaExampleToSource = useCallback((text: string) => {
    const startedAt = performance.now();
    runSourceReplacePlan({
      plan: buildApplySchemaExampleToSourcePlan(sourceText, text),
      eventName: 'SCHEMA_EXAMPLE_APPLY_TO_SOURCE',
      category: 'schema',
      startedAt,
      onApply,
      onConfirm: setPendingSchemaExampleText,
      onTrackToolEvent,
    });
  }, [onApply, onTrackToolEvent, sourceText]);

  const handleConfirmApplySchemaExampleToSource = useCallback(() => {
    confirmPendingSourceReplacement({
      pendingText: pendingSchemaExampleText,
      successMessage: '已用 Schema 示例替换 SOURCE',
      eventName: 'SCHEMA_EXAMPLE_APPLY_TO_SOURCE',
      category: 'schema',
      onApply,
      onClearPending: () => setPendingSchemaExampleText(null),
      onTrackToolEvent,
    });
  }, [onApply, onTrackToolEvent, pendingSchemaExampleText]);

  const handleCancelApplySchemaExampleToSource = useCallback(() => {
    cancelPendingSourceReplacement('SCHEMA_EXAMPLE_APPLY_TO_SOURCE', 'schema', () => {
      setPendingSchemaExampleText(null);
    }, onTrackToolEvent);
  }, [onTrackToolEvent]);

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
