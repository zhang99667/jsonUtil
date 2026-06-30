import { useEffect, useRef } from 'react';
import type { ValidationResult } from '../types';
import { ASYNC_VALIDATION_THRESHOLD } from '../utils/appAsyncPolicy';
import {
  cleanJsonInput,
  startJsonValidation,
} from '../utils/jsonValidation';

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
    let validationTask: ReturnType<typeof startJsonValidation> | null = null;
    const timeoutId = setTimeout(() => {
      if (input && input.trim()) {
        const cleanInput = cleanJsonInput(input);
        const requestId = ++sourceValidationRequestIdRef.current;
        validationTask = startJsonValidation(cleanInput, ASYNC_VALIDATION_THRESHOLD, { requireContainer: true });
        validationTask.promise.then(result => {
          if (requestId === sourceValidationRequestIdRef.current) {
            onSetValidation(result);
          }
        });
        return;
      }

      sourceValidationRequestIdRef.current++;
      onSetValidation({ isValid: true });
    }, SOURCE_VALIDATION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      validationTask?.cancel();
    };
  }, [input, onSetValidation]);
};
