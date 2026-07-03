import { useEffect, useRef } from 'react';
import type { ValidationResult } from '../types';
import { runAppSourceValidationRequest } from '../utils/appSourceValidationRequest';

interface UseAppSourceValidationInput {
  input: string;
  onSetValidation: (result: ValidationResult) => void;
}

const SOURCE_VALIDATION_DEBOUNCE_MS = 500;

export const useAppSourceValidation = ({
  input,
  onSetValidation,
}: UseAppSourceValidationInput): void => {
  const sourceValidationRequestIdRef = useRef(0);

  useEffect(() => {
    let validationTask: ReturnType<typeof runAppSourceValidationRequest> = null;
    const timeoutId = setTimeout(() => {
      validationTask = runAppSourceValidationRequest({
        input,
        requestIdRef: sourceValidationRequestIdRef,
        onSetValidation,
      });
    }, SOURCE_VALIDATION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      validationTask?.cancel();
    };
  }, [input, onSetValidation]);
};
