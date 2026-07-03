import { useCallback, useMemo, useState } from 'react';

import type { ValidationResult } from '../types';
import { getJsonValidationErrorLocation } from '../utils/jsonValidation';

interface UseAppEditorValidationLocationsOptions {
  sourceText: string;
  previewText: string;
  sourceValidation: ValidationResult;
  previewValidation: ValidationResult;
  onSetActiveEditor: (editor: 'SOURCE') => void;
}

export const useAppEditorValidationLocations = ({
  sourceText,
  previewText,
  sourceValidation,
  previewValidation,
  onSetActiveEditor,
}: UseAppEditorValidationLocationsOptions) => {
  const [sourceErrorLocateSignal, setSourceErrorLocateSignal] = useState(0);
  const sourceErrorLocation = useMemo(
    () => sourceValidation.isValid
      ? null
      : getJsonValidationErrorLocation(sourceText, sourceValidation.error),
    [sourceText, sourceValidation]
  );
  const previewErrorLocation = useMemo(
    () => previewValidation.isValid
      ? null
      : getJsonValidationErrorLocation(previewText, previewValidation.error),
    [previewText, previewValidation]
  );
  const handleLocateSourceErrorFromStatus = useCallback(() => {
    if (!sourceErrorLocation) return;

    onSetActiveEditor('SOURCE');
    setSourceErrorLocateSignal(signal => signal + 1);
  }, [onSetActiveEditor, sourceErrorLocation]);

  return {
    sourceErrorLocation,
    previewErrorLocation,
    sourceErrorLocateSignal,
    handleLocateSourceErrorFromStatus,
  };
};
