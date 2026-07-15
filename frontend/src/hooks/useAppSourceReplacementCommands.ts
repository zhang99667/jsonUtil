import { useRef, type MutableRefObject } from 'react';
import { TransformMode, type HighlightRange } from '../types';
import { useAppApplySourceReplacementCommands } from './useAppApplySourceReplacementCommands';
import { useAppClearSourceCommands } from './useAppClearSourceCommands';
import { useAppPasteSourceCommand } from './useAppPasteSourceCommand';
import { useAppSchemeInspectSourceCommand } from './useAppSchemeInspectSourceCommand';
import {
  useAppSourceApplyEffects,
  type AppSmartSuggestionOrigin,
} from './useAppSourceApplyEffects';
import type {
  AppSourceReplacementTarget,
  AppSourceReplacementTrackEvent,
} from '../utils/appSourceReplacementCommandTypes';
import { buildAppSourceReplacementCommands } from '../utils/appSourceReplacementCommandBundle';

export type { AppSmartSuggestionOrigin } from './useAppSourceApplyEffects';
interface AppSourceReplacementCommandsInput {
  activeFileId: string | null;
  input: string;
  output: string;
  isOutputTransforming: boolean;
  smartSuggestionOriginTextRef: MutableRefObject<string>;
  onInputChange: (value: string) => void;
  onSetMode: (mode: TransformMode) => void;
  onSetHighlightRange: (range: HighlightRange | null) => void;
  onSetJsonPathPanelOpen: (isOpen: boolean) => void;
  onSetTransformReportOpen: (isOpen: boolean) => void;
  onSetSchemeDecodeOpen: (isOpen: boolean) => void;
  onSetSmartSuggestionOrigin: (origin: AppSmartSuggestionOrigin | null) => void;
  onTrackToolEvent: AppSourceReplacementTrackEvent;
}

export const useAppSourceReplacementCommands = ({
  activeFileId,
  input,
  output,
  isOutputTransforming,
  smartSuggestionOriginTextRef,
  onInputChange,
  onSetMode,
  onSetHighlightRange,
  onSetJsonPathPanelOpen,
  onSetTransformReportOpen,
  onSetSchemeDecodeOpen,
  onSetSmartSuggestionOrigin,
  onTrackToolEvent,
}: AppSourceReplacementCommandsInput) => {
  const sourceTargetRef = useRef<AppSourceReplacementTarget>({ activeFileId, sourceText: input });
  sourceTargetRef.current = { activeFileId, sourceText: input };

  const clearSourceCommands = useAppClearSourceCommands({
    sourceTargetRef,
    onInputChange,
    onSetHighlightRange,
    onTrackToolEvent,
  });

  const {
    applySourceText,
    applySchemeInspectSourceText,
    applySourceTextFromClipboard,
    handleSchemeInspectSuccessSkip,
  } = useAppSourceApplyEffects({
    smartSuggestionOriginTextRef,
    onInputChange,
    onSetMode,
    onSetHighlightRange,
    onSetJsonPathPanelOpen,
    onSetTransformReportOpen,
    onSetSchemeDecodeOpen,
    onSetSmartSuggestionOrigin,
  });

  const schemeInspectCommands = useAppSchemeInspectSourceCommand({
    sourceTargetRef,
    onApply: applySchemeInspectSourceText,
    onSuccessSkip: handleSchemeInspectSuccessSkip,
    onTrackToolEvent,
  });

  const pasteCommands = useAppPasteSourceCommand({
    sourceTargetRef,
    onApply: applySourceTextFromClipboard,
    onTrackToolEvent,
  });

  const applyCommands = useAppApplySourceReplacementCommands({
    sourceTargetRef,
    previewText: output,
    isOutputTransforming,
    onApply: applySourceText,
    onTrackToolEvent,
  });

  return buildAppSourceReplacementCommands({
    clearSourceCommands,
    schemeInspectCommands,
    pasteCommands,
    applyCommands,
  });
};
