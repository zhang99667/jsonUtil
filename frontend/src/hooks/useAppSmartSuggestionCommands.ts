import { useCallback, type MutableRefObject } from 'react';
import { TransformMode } from '../types';
import type { SmartSuggestionActionId } from '../utils/smartInputSuggestion';
import type { ToolEventStatus } from '../utils/productTelemetry';
import { runAppSmartSuggestionCommand } from '../utils/appSmartSuggestionCommandRunner';
import { showError, showSuccess } from '../utils/toast';

type AppSmartSuggestionTrackEvent = (
  eventName: string,
  category: string,
  status?: ToolEventStatus,
  startedAt?: number,
) => void;

interface SmartSuggestionSchemeInputRequest {
  id: number;
  value: string;
}

interface UseAppSmartSuggestionCommandsInput {
  currentMode: TransformMode;
  sourceText: string;
  schemeInputRequestIdRef: MutableRefObject<number>;
  onRunAiFix: () => void;
  onSetMode: (mode: TransformMode) => void;
  onSetHighlightRange: (range: null) => void;
  onSetSchemeInputRequest: (request: SmartSuggestionSchemeInputRequest) => void;
  onSetSchemePanelOpen: (isOpen: boolean) => void;
  onSetTransformReportOpen: (isOpen: boolean) => void;
  onSetJsonTreePanelOpen: (isOpen: boolean) => void;
  onSetJsonSchemaPanelOpen: (isOpen: boolean) => void;
  onTrackToolEvent: AppSmartSuggestionTrackEvent;
}

export const useAppSmartSuggestionCommands = ({
  currentMode,
  sourceText,
  schemeInputRequestIdRef,
  onRunAiFix,
  onSetMode,
  onSetHighlightRange,
  onSetSchemeInputRequest,
  onSetSchemePanelOpen,
  onSetTransformReportOpen,
  onSetJsonTreePanelOpen,
  onSetJsonSchemaPanelOpen,
  onTrackToolEvent,
}: UseAppSmartSuggestionCommandsInput) => {
  const handleSmartSuggestionAction = useCallback((actionId: SmartSuggestionActionId) => (
    runAppSmartSuggestionCommand({
      actionId,
      currentMode,
      sourceText,
    }, {
      onRunAiFix,
      onSetMode,
      onClearHighlight: () => onSetHighlightRange(null),
      onOpenSchemeInput: (value) => onSetSchemeInputRequest({
        id: ++schemeInputRequestIdRef.current,
        value,
      }),
      onSetSchemePanelOpen,
      onSetTransformReportOpen,
      onSetJsonTreePanelOpen,
      onSetJsonSchemaPanelOpen,
      onShowError: showError,
      onShowSuccess: showSuccess,
      onTrackToolEvent,
    })
  ), [
    currentMode,
    onRunAiFix,
    onSetHighlightRange,
    onSetJsonSchemaPanelOpen,
    onSetJsonTreePanelOpen,
    onSetMode,
    onSetSchemeInputRequest,
    onSetSchemePanelOpen,
    onSetTransformReportOpen,
    onTrackToolEvent,
    schemeInputRequestIdRef,
    sourceText,
  ]);

  return { handleSmartSuggestionAction };
};
