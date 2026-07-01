import { getLocalProcessingStatus } from './localProcessingStatus';
import {
  getStatusBarByteSizeText,
  getStatusBarSourceValidationStatus,
} from './statusBarState';
import { buildStatusBarFileState } from './statusBarFileState';
import { getStatusBarSourceValidationAction } from './statusBarSourceValidationAction';
import type { StatusBarViewModelInput } from './statusBarViewModelTypes';

export type { StatusBarViewModelInput } from './statusBarViewModelTypes';

export const buildStatusBarViewModel = ({
  inputLength,
  activeContentByteLength,
  isStatsLimited,
  activeFileId,
  files,
  isAutoSaveEnabled,
  isSourceLarge,
  isOutputTransforming,
  isAiRepairing,
  isAiConfigured,
  hasSourceContent,
  isSourceJsonCandidate,
  sourceStandaloneDeepFormatKind,
  sourceValidation,
  sourceValidationLocation,
  onLocateSourceError,
  onOpenSourceSchemeInput,
}: StatusBarViewModelInput) => {
  const fileState = buildStatusBarFileState({
    activeFileId,
    files,
    inputLength,
    isAutoSaveEnabled,
  });

  return {
    activeFile: fileState.activeFile,
    byteSizeText: getStatusBarByteSizeText(activeContentByteLength, isStatsLimited),
    saveStatus: fileState.saveStatus,
    sourceValidationStatus: getStatusBarSourceValidationStatus({
      hasSourceContent,
      isSourceJsonCandidate,
      sourceStandaloneDeepFormatKind,
      sourceValidation,
      sourceValidationLocation,
    }),
    sourceValidationAction: getStatusBarSourceValidationAction({
      sourceValidation,
      sourceValidationLocation,
      sourceStandaloneDeepFormatKind,
      onLocateSourceError,
      onOpenSourceSchemeInput,
    }),
    localProcessingStatus: getLocalProcessingStatus({
      hasSourceContent,
      isSourceLarge,
      isOutputTransforming,
      isAiRepairing,
      isAiConfigured,
    }),
  };
};
