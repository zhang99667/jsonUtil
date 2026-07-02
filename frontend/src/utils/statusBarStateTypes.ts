import type { ValidationResult } from '../types';
import type { StandaloneDeepFormatInputKind } from './transformations';

export interface StatusBarBadgeState {
  label: string;
  className: string;
  title: string;
}

export interface StatusBarSourceValidationLocation {
  line: number;
  column: number;
}

export interface StatusBarSaveStatusInput {
  hasActiveFile: boolean;
  isSavedFile: boolean;
  isDirty: boolean;
  inputLength: number;
  isAutoSaveEnabled: boolean;
}

export interface StatusBarSourceValidationInput {
  hasSourceContent: boolean;
  isSourceJsonCandidate: boolean;
  sourceStandaloneDeepFormatKind: StandaloneDeepFormatInputKind | null;
  sourceValidation: ValidationResult;
  sourceValidationLocation: StatusBarSourceValidationLocation | null;
}
