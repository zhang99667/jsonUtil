import type { FileTab, ValidationResult } from '../types';
import type { StatusBarSourceValidationLocation } from './statusBarState';
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
