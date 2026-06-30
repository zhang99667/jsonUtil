import type { MutableRefObject } from 'react';
import { TransformMode, type HighlightRange } from '../types';
import { useAppApplySourceReplacementCommands } from './useAppApplySourceReplacementCommands';
import { useAppClearSourceCommands } from './useAppClearSourceCommands';
import { useAppPasteSourceCommand } from './useAppPasteSourceCommand';
import { useAppSchemeInspectSourceCommand } from './useAppSchemeInspectSourceCommand';
import {
  useAppSourceApplyEffects,
  type AppSmartSuggestionOrigin,
} from './useAppSourceApplyEffects';
import type { AppSourceReplacementTrackEvent } from '../utils/appSourceReplacementCommandHelpers';

export type { AppSmartSuggestionOrigin } from './useAppSourceApplyEffects';
interface AppSourceReplacementCommandsInput {
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
  const {
    isClearSourceConfirmOpen,
    handleRequestClearSource,
    handleConfirmClearSource,
    handleCancelClearSource,
  } = useAppClearSourceCommands({
    sourceText: input,
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

  const {
    pendingSchemeInspectSourceText,
    handleInspectSourceFromScheme,
    handleConfirmSchemeInspectSource,
    handleCancelSchemeInspectSource,
  } = useAppSchemeInspectSourceCommand({
    sourceText: input,
    onApply: applySchemeInspectSourceText,
    onSuccessSkip: handleSchemeInspectSuccessSkip,
    onTrackToolEvent,
  });

  const {
    pendingPasteSourceText,
    handlePasteSource,
    handleConfirmPasteSource,
    handleCancelPasteSource,
  } = useAppPasteSourceCommand({
    sourceText: input,
    onApply: applySourceTextFromClipboard,
    onTrackToolEvent,
  });

  const {
    pendingApplyPreviewText,
    pendingSchemaExampleText,
    handleRequestApplyPreviewToSource,
    handleConfirmApplyPreviewToSource,
    handleCancelApplyPreviewToSource,
    handleRequestApplySchemaExampleToSource,
    handleConfirmApplySchemaExampleToSource,
    handleCancelApplySchemaExampleToSource,
  } = useAppApplySourceReplacementCommands({
    sourceText: input,
    previewText: output,
    isOutputTransforming,
    onApply: applySourceText,
    onTrackToolEvent,
  });

  return {
    isClearSourceConfirmOpen,
    pendingPasteSourceText,
    pendingApplyPreviewText,
    pendingSchemaExampleText,
    pendingSchemeInspectSourceText,
    handleInspectSourceFromScheme,
    handleConfirmSchemeInspectSource,
    handleCancelSchemeInspectSource,
    handlePasteSource,
    handleConfirmPasteSource,
    handleCancelPasteSource,
    handleRequestApplyPreviewToSource,
    handleConfirmApplyPreviewToSource,
    handleCancelApplyPreviewToSource,
    handleRequestApplySchemaExampleToSource,
    handleConfirmApplySchemaExampleToSource,
    handleCancelApplySchemaExampleToSource,
    handleRequestClearSource,
    handleConfirmClearSource,
    handleCancelClearSource,
  };
};
