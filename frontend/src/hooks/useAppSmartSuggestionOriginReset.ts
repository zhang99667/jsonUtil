import { useEffect, type MutableRefObject } from 'react';

import { shouldKeepSmartSuggestionOrigin } from '../utils/smartSuggestionText';
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
    if (shouldKeepSmartSuggestionOrigin(sourceText, hasSmartSuggestion, smartSuggestionOriginTextRef.current)) return;

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
