import { useEffect, type MutableRefObject } from 'react';

import { cleanJsonInput } from '../utils/jsonValidation';
import type { AppSmartSuggestionOrigin } from './useAppSourceApplyEffects';

interface UseAppSmartSuggestionOriginResetOptions {
  sourceText: string;
  hasSmartSuggestion: boolean;
  smartSuggestionOrigin: AppSmartSuggestionOrigin | null;
  smartSuggestionOriginTextRef: MutableRefObject<string>;
  onSetSmartSuggestionOrigin: (origin: AppSmartSuggestionOrigin | null) => void;
}

export const useAppSmartSuggestionOriginReset = ({
  sourceText,
  hasSmartSuggestion,
  smartSuggestionOrigin,
  smartSuggestionOriginTextRef,
  onSetSmartSuggestionOrigin,
}: UseAppSmartSuggestionOriginResetOptions): void => {
  useEffect(() => {
    if (!smartSuggestionOrigin) return;
    if (cleanJsonInput(sourceText) === smartSuggestionOriginTextRef.current && hasSmartSuggestion) return;

    smartSuggestionOriginTextRef.current = '';
    onSetSmartSuggestionOrigin(null);
  }, [
    hasSmartSuggestion,
    onSetSmartSuggestionOrigin,
    smartSuggestionOrigin,
    smartSuggestionOriginTextRef,
    sourceText,
  ]);
};
