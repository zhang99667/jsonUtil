import { useCallback, useMemo, type MutableRefObject } from 'react';
import { TransformMode } from '../types';
import type { SmartSuggestionActionId } from '../utils/smartInputSuggestion';
import {
  runAppSmartSuggestionCommand,
  type AppSmartSuggestionTrackEvent,
} from '../utils/appSmartSuggestionCommandRunner';
import {
  buildAppSmartSuggestionCommandEffects,
  type SmartSuggestionSchemeInputRequest,
} from '../utils/appSmartSuggestionCommandEffects';
import { showError, showSuccess } from '../utils/toast';

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
  const smartSuggestionEffects = useMemo(() => buildAppSmartSuggestionCommandEffects({
    schemeInputRequestIdRef,
    onRunAiFix,
    onSetMode,
    onSetHighlightRange,
    onSetSchemeInputRequest,
    onSetSchemePanelOpen,
    onSetTransformReportOpen,
    onSetJsonTreePanelOpen,
    onSetJsonSchemaPanelOpen,
    onShowError: showError,
    onShowSuccess: showSuccess,
    onTrackToolEvent,
  }), [
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
  ]);

  const handleSmartSuggestionAction = useCallback((actionId: SmartSuggestionActionId) => (
    runAppSmartSuggestionCommand({
      actionId,
      currentMode,
      sourceText,
    }, smartSuggestionEffects)
  ), [
    currentMode,
    smartSuggestionEffects,
    sourceText,
  ]);

  return { handleSmartSuggestionAction };
};
