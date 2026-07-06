import { useCallback, type MutableRefObject } from 'react';
import { TransformMode, type HighlightRange } from '../types';
import { normalizeSmartSuggestionText } from '../utils/smartSuggestionText';
import { getSmartInputSuggestion } from '../utils/smartInputSuggestion';
import { getSourceUpdateSuccessMessage } from '../utils/appWorkflowHelpers';
import { showSuccess } from '../utils/toast';

export type AppSmartSuggestionOrigin = 'clipboard';

interface UseAppSourceApplyEffectsInput {
  smartSuggestionOriginTextRef: MutableRefObject<string>;
  onInputChange: (value: string) => void;
  onSetMode: (mode: TransformMode) => void;
  onSetHighlightRange: (range: HighlightRange | null) => void;
  onSetJsonPathPanelOpen: (isOpen: boolean) => void;
  onSetTransformReportOpen: (isOpen: boolean) => void;
  onSetSchemeDecodeOpen: (isOpen: boolean) => void;
  onSetSmartSuggestionOrigin: (origin: AppSmartSuggestionOrigin | null) => void;
}

export const useAppSourceApplyEffects = ({
  smartSuggestionOriginTextRef,
  onInputChange,
  onSetMode,
  onSetHighlightRange,
  onSetJsonPathPanelOpen,
  onSetTransformReportOpen,
  onSetSchemeDecodeOpen,
  onSetSmartSuggestionOrigin,
}: UseAppSourceApplyEffectsInput) => {
  const resetSchemeInspectPanels = useCallback(() => {
    onSetMode(TransformMode.DEEP_FORMAT);
    onSetHighlightRange(null);
    onSetJsonPathPanelOpen(false);
    onSetTransformReportOpen(false);
    onSetSchemeDecodeOpen(false);
  }, [onSetHighlightRange, onSetJsonPathPanelOpen, onSetMode, onSetSchemeDecodeOpen, onSetTransformReportOpen]);

  const applySourceText = useCallback((text: string, successMessage: string) => {
    onInputChange(text);
    onSetHighlightRange(null);
    showSuccess(getSourceUpdateSuccessMessage(successMessage, text));
  }, [onInputChange, onSetHighlightRange]);

  const applySchemeInspectSourceText = useCallback((text: string, successMessage: string) => {
    applySourceText(text, successMessage);
    resetSchemeInspectPanels();
  }, [applySourceText, resetSchemeInspectPanels]);

  const applySourceTextFromClipboard = useCallback((text: string, successMessage: string) => {
    applySourceText(text, successMessage);
    const clipboardSourceText = normalizeSmartSuggestionText(text);
    if (getSmartInputSuggestion(clipboardSourceText)) {
      smartSuggestionOriginTextRef.current = clipboardSourceText;
      onSetSmartSuggestionOrigin('clipboard');
    } else {
      smartSuggestionOriginTextRef.current = '';
    }
  }, [applySourceText, onSetSmartSuggestionOrigin, smartSuggestionOriginTextRef]);

  return {
    applySourceText,
    applySchemeInspectSourceText,
    applySourceTextFromClipboard,
    handleSchemeInspectSuccessSkip: resetSchemeInspectPanels,
  };
};
