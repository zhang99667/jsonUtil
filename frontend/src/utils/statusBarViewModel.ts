import type { FileTab, ValidationResult } from '../types';
import { getLocalProcessingStatus } from './localProcessingStatus';
import {
  getStatusBarByteSizeText,
  getStatusBarSaveStatus,
  getStatusBarSourceValidationStatus,
  type StatusBarSourceValidationLocation,
} from './statusBarState';
import { getStatusBarSourceValidationAction } from './statusBarSourceValidationAction';
import type { StandaloneDeepFormatInputKind } from './transformations';

export interface StatusBarViewModelInput {
  inputLength: number;
  activeContentByteLength: number;
  isStatsLimited: boolean;
  activeFileId: string | null;
  files: FileTab[];
  isAutoSaveEnabled: boolean;
  isSourceLarge: boolean;
  isOutputTransforming: boolean;
  isAiRepairing: boolean;
  isAiConfigured: boolean;
  hasSourceContent: boolean;
  isSourceJsonCandidate: boolean;
  sourceStandaloneDeepFormatKind: StandaloneDeepFormatInputKind | null;
  sourceValidation: ValidationResult;
  sourceValidationLocation: StatusBarSourceValidationLocation | null;
  onLocateSourceError?: () => void;
  onOpenSourceSchemeInput?: () => void;
}

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
  const activeFile = activeFileId ? files.find(file => file.id === activeFileId) ?? null : null;

  return {
    activeFile,
    byteSizeText: getStatusBarByteSizeText(activeContentByteLength, isStatsLimited),
    saveStatus: getStatusBarSaveStatus({
      hasActiveFile: Boolean(activeFile),
      isSavedFile: Boolean(activeFile?.handle),
      isDirty: Boolean(activeFile?.isDirty),
      inputLength,
      isAutoSaveEnabled,
    }),
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
