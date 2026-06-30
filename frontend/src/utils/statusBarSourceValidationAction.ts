import type {
  StatusBarSourceValidationAction,
  StatusBarSourceValidationActionInput,
} from './statusBarSourceValidationActionTypes';

export type {
  StatusBarSourceValidationAction,
  StatusBarSourceValidationActionInput,
} from './statusBarSourceValidationActionTypes';

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
