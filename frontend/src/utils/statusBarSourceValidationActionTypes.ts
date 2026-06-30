import type { ValidationResult } from '../types';
import type { StatusBarSourceValidationLocation } from './statusBarState';
import type { StandaloneDeepFormatInputKind } from './transformations';

export type StatusBarSourceValidationAction =
  | {
      type: 'locate';
      onClick: () => void;
    }
  | {
      type: 'openScheme';
      onClick: () => void;
    }
  | null;

export interface StatusBarSourceValidationActionInput {
  sourceValidation: ValidationResult;
  sourceValidationLocation: StatusBarSourceValidationLocation | null;
  sourceStandaloneDeepFormatKind: StandaloneDeepFormatInputKind | null;
  onLocateSourceError?: () => void;
  onOpenSourceSchemeInput?: () => void;
}
