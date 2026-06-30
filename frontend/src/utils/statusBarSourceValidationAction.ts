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

interface StatusBarSourceValidationActionInput {
  sourceValidation: ValidationResult;
  sourceValidationLocation: StatusBarSourceValidationLocation | null;
  sourceStandaloneDeepFormatKind: StandaloneDeepFormatInputKind | null;
  onLocateSourceError?: () => void;
  onOpenSourceSchemeInput?: () => void;
}

export const getStatusBarSourceValidationAction = ({
  sourceValidation,
  sourceValidationLocation,
  sourceStandaloneDeepFormatKind,
  onLocateSourceError,
  onOpenSourceSchemeInput,
}: StatusBarSourceValidationActionInput): StatusBarSourceValidationAction => {
  if (!sourceValidation.isValid && sourceValidationLocation && onLocateSourceError) {
    return { type: 'locate', onClick: onLocateSourceError };
  }

  if (sourceStandaloneDeepFormatKind && onOpenSourceSchemeInput) {
    return { type: 'openScheme', onClick: onOpenSourceSchemeInput };
  }

  return null;
};
