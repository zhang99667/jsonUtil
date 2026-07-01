import { useCallback } from 'react';
import {
  buildApplyPreviewToSourcePlan,
  buildApplySchemaExampleToSourcePlan,
} from '../utils/appSourceReplacePlans';
import type { AppSourceReplacementTrackEvent } from '../utils/appSourceReplacementCommandTypes';
import { usePendingSourceReplacementCommand } from './usePendingSourceReplacementCommand';

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
  const {
    pendingText: pendingApplyPreviewText,
    handleRequest: requestApplyPreviewToSource,
    handleConfirm: handleConfirmApplyPreviewToSource,
    handleCancel: handleCancelApplyPreviewToSource,
  } = usePendingSourceReplacementCommand({
    eventName: 'PREVIEW_APPLY_TO_SOURCE',
    category: 'editor',
    confirmSuccessMessage: '已用 PREVIEW 替换 SOURCE',
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
    onApply,
    onTrackToolEvent,
  });

  const handleRequestApplyPreviewToSource = useCallback(() => {
    requestApplyPreviewToSource(
      buildApplyPreviewToSourcePlan(sourceText, previewText, isOutputTransforming),
      { startedAt: performance.now() },
    );
  }, [isOutputTransforming, previewText, requestApplyPreviewToSource, sourceText]);

  const handleRequestApplySchemaExampleToSource = useCallback((text: string) => {
    requestApplySchemaExampleToSource(
      buildApplySchemaExampleToSourcePlan(sourceText, text),
      { startedAt: performance.now() },
    );
  }, [requestApplySchemaExampleToSource, sourceText]);

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
