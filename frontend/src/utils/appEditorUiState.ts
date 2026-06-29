import {
  getStandaloneDeepFormatInputKind,
  type StandaloneDeepFormatInputKind,
} from './transformations';
import { isJsonContainerCandidate } from './jsonValidation';
import {
  getApplyPreviewTitle,
  getAutoSaveAriaLabel,
  getAutoSaveTitle,
  getClearSourceTitle,
  getCopyPreviewTitle,
  getCopySourceTitle,
  getSourceAiRepairTitle,
  getTransformReportTitle,
} from './appActionLabels';
import {
  getApplyPreviewConfirmMessage,
  getApplySchemaExampleConfirmMessage,
  getClearSourceConfirmMessage,
  getPasteSourceConfirmMessage,
  getSchemeInspectConfirmMessage,
} from './appWorkflowHelpers';

export interface AppEditorUiStateInput {
  sourceText: string;
  previewText: string;
  isProcessing: boolean;
  isOutputTransforming: boolean;
  hasActiveFile: boolean;
  activeFileHasHandle: boolean;
  isAutoSaveEnabled: boolean;
  hasTransformReportContext: boolean;
  isClearSourceConfirmOpen: boolean;
  pendingPasteSourceText: string | null;
  pendingApplyPreviewText: string | null;
  pendingSchemaExampleText: string | null;
  pendingSchemeInspectSourceText: string | null;
}

export interface AppEditorUiState {
  hasSourceContent: boolean;
  hasPreviewContent: boolean;
  isPreviewSameAsSource: boolean;
  isSourceJsonCandidate: boolean;
  sourceStandaloneDeepFormatKind: StandaloneDeepFormatInputKind | null;
  canUseAutoSave: boolean;
  isAutoSaveActive: boolean;
  autoSaveTitle: string;
  autoSaveAriaLabel: string;
  copySourceTitle: string;
  clearSourceTitle: string;
  sourceAiRepairTitle: string;
  transformReportTitle: string;
  applyPreviewTitle: string;
  copyPreviewTitle: string;
  clearSourceConfirmMessage: string;
  pasteSourceConfirmMessage: string;
  applyPreviewConfirmMessage: string;
  applySchemaExampleConfirmMessage: string;
  schemeInspectConfirmMessage: string;
}

export const buildAppEditorUiState = (input: AppEditorUiStateInput): AppEditorUiState => {
  const hasSourceContent = input.sourceText.trim().length > 0;
  const hasPreviewContent = input.previewText.trim().length > 0;
  const isPreviewSameAsSource = input.previewText === input.sourceText;
  const sourceStandaloneDeepFormatKind = hasSourceContent
    ? getStandaloneDeepFormatInputKind(input.sourceText)
    : null;
  const canUseAutoSave = input.hasActiveFile && input.activeFileHasHandle;
  const isAutoSaveActive = canUseAutoSave && input.isAutoSaveEnabled;
  const autoSaveTitle = getAutoSaveTitle(
    input.hasActiveFile,
    input.activeFileHasHandle,
    input.isAutoSaveEnabled
  );

  return {
    hasSourceContent,
    hasPreviewContent,
    isPreviewSameAsSource,
    isSourceJsonCandidate: hasSourceContent && isJsonContainerCandidate(input.sourceText),
    sourceStandaloneDeepFormatKind,
    canUseAutoSave,
    isAutoSaveActive,
    autoSaveTitle,
    autoSaveAriaLabel: getAutoSaveAriaLabel(canUseAutoSave, isAutoSaveActive, autoSaveTitle),
    copySourceTitle: getCopySourceTitle(hasSourceContent),
    clearSourceTitle: getClearSourceTitle(hasSourceContent),
    sourceAiRepairTitle: getSourceAiRepairTitle(input.isProcessing),
    transformReportTitle: getTransformReportTitle(input.isOutputTransforming, input.hasTransformReportContext),
    applyPreviewTitle: getApplyPreviewTitle(input.isOutputTransforming, hasPreviewContent, isPreviewSameAsSource),
    copyPreviewTitle: getCopyPreviewTitle(input.isOutputTransforming, hasPreviewContent),
    clearSourceConfirmMessage: getClearSourceConfirmMessage(input.sourceText, input.isClearSourceConfirmOpen),
    pasteSourceConfirmMessage: getPasteSourceConfirmMessage(input.sourceText, input.pendingPasteSourceText),
    applyPreviewConfirmMessage: getApplyPreviewConfirmMessage(input.sourceText, input.pendingApplyPreviewText),
    applySchemaExampleConfirmMessage: getApplySchemaExampleConfirmMessage(
      input.sourceText,
      input.pendingSchemaExampleText
    ),
    schemeInspectConfirmMessage: getSchemeInspectConfirmMessage(
      input.sourceText,
      input.pendingSchemeInspectSourceText
    ),
  };
};
