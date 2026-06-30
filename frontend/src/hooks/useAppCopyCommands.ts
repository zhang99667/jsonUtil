import { useCallback, useMemo } from 'react';
import { copyText } from '../utils/clipboard';
import type { ToolEventStatus } from '../utils/productTelemetry';
import { showError, showSuccess } from '../utils/toast';
import {
  runAppCopyPreviewCommand,
  runAppCopySourceCommand,
} from '../utils/appCopyCommandRunner';

type AppCopyTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

interface UseAppCopyCommandsInput {
  sourceText: string;
  previewText: string;
  isOutputTransforming: boolean;
  onTrackToolEvent: AppCopyTrackEvent;
}

export const useAppCopyCommands = ({
  sourceText,
  previewText,
  isOutputTransforming,
  onTrackToolEvent,
}: UseAppCopyCommandsInput) => {
  const effects = useMemo(() => ({
    onCopyText: copyText,
    onShowError: showError,
    onShowSuccess: showSuccess,
    onTrackToolEvent,
  }), [onTrackToolEvent]);

  const handleCopySource = useCallback(() => runAppCopySourceCommand(sourceText, effects), [
    effects,
    sourceText,
  ]);

  const handleCopyPreview = useCallback(() => runAppCopyPreviewCommand(
    previewText,
    isOutputTransforming,
    effects,
  ), [effects, isOutputTransforming, previewText]);

  return { handleCopySource, handleCopyPreview };
};
