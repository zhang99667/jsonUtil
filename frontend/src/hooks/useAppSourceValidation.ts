import { useEffect, useRef } from 'react';
import type { ValidationResult } from '../types';
import { startAppSourceValidationScheduler } from '../utils/appSourceValidationScheduler';

interface UseAppSourceValidationInput {
  input: string;
  onSetValidation: (result: ValidationResult) => void;
}

export const useAppSourceValidation = ({ input, onSetValidation }: UseAppSourceValidationInput): void => {
  const sourceValidationRequestIdRef = useRef(0);

  useEffect(() => startAppSourceValidationScheduler({
    input,
    requestIdRef: sourceValidationRequestIdRef,
    onSetValidation,
  }), [input, onSetValidation]);
};
