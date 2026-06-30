import { useCallback, useMemo } from 'react';
import { TransformMode } from '../types';
import type { SmartSuggestionActionId } from '../utils/smartInputSuggestion';
import {
  runAppSmartSuggestionCommand,
  type AppSmartSuggestionCommandEffects,
  type AppSmartSuggestionTrackEvent,
} from '../utils/appSmartSuggestionCommandRunner';
import { showError, showSuccess } from '../utils/toast';

interface UseAppSmartSuggestionCommandsInput {
  currentMode: TransformMode;
  sourceText: string;
  onRunAiFix: () => void;
  onSetMode: (mode: TransformMode) => void;
  onSetHighlightRange: (range: null) => void;
  onOpenSchemeInput: (value: string) => void;
  onSetSchemePanelOpen: (isOpen: boolean) => void;
  onSetTransformReportOpen: (isOpen: boolean) => void;
  onSetJsonTreePanelOpen: (isOpen: boolean) => void;
  onSetJsonSchemaPanelOpen: (isOpen: boolean) => void;
  onTrackToolEvent: AppSmartSuggestionTrackEvent;
}

export const useAppSmartSuggestionCommands = ({
  currentMode,
  sourceText,
  onRunAiFix,
  onSetMode,
  onSetHighlightRange,
  onOpenSchemeInput,
  onSetSchemePanelOpen,
  onSetTransformReportOpen,
  onSetJsonTreePanelOpen,
  onSetJsonSchemaPanelOpen,
  onTrackToolEvent,
}: UseAppSmartSuggestionCommandsInput) => {
  const smartSuggestionEffects = useMemo<AppSmartSuggestionCommandEffects>(() => ({
    onRunAiFix,
    onSetMode,
    onClearHighlight: () => onSetHighlightRange(null),
    onOpenSchemeInput,
    onSetSchemePanelOpen,
    onSetTransformReportOpen,
    onSetJsonTreePanelOpen,
    onSetJsonSchemaPanelOpen,
    onShowError: showError,
    onShowSuccess: showSuccess,
    onTrackToolEvent,
  }), [
    onOpenSchemeInput,
    onRunAiFix,
    onSetHighlightRange,
    onSetJsonSchemaPanelOpen,
    onSetJsonTreePanelOpen,
    onSetMode,
    onSetSchemePanelOpen,
    onSetTransformReportOpen,
    onTrackToolEvent,
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
