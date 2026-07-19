import { useCallback, useMemo, useRef } from 'react';
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
  const copyIntentRef = useRef(0);
  const effects = useMemo(() => ({
    onCopyText: copyText,
    onShowError: showError,
    onShowSuccess: showSuccess,
    onTrackToolEvent,
  }), [onTrackToolEvent]);

  const createGuardedEffects = useCallback(() => {
    const copyIntent = ++copyIntentRef.current;
    const guard = <Arguments extends unknown[]>(effect: (...args: Arguments) => void) => (...args: Arguments) => {
      if (copyIntentRef.current === copyIntent) effect(...args);
    };
    return {
      ...effects,
      onShowError: guard(effects.onShowError),
      onShowSuccess: guard(effects.onShowSuccess),
      onTrackToolEvent: guard(effects.onTrackToolEvent),
    };
  }, [effects]);

  const handleCopySource = useCallback(() => runAppCopySourceCommand(sourceText, createGuardedEffects()), [
    createGuardedEffects,
    sourceText,
  ]);

  const handleCopyPreview = useCallback(() => runAppCopyPreviewCommand(
    previewText,
    isOutputTransforming,
    createGuardedEffects(),
  ), [createGuardedEffects, isOutputTransforming, previewText]);

  return { handleCopySource, handleCopyPreview };
};
