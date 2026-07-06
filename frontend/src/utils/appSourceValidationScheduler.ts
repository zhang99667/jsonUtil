import type { ValidationResult } from '../types';
import { runAppSourceValidationRequest } from './appSourceValidationRequest';
import { cleanJsonInput, isCleanJsonInputEmpty } from './jsonValidation';
import type { MutableValueRef } from './mutableValueRef';

interface AppSourceValidationSchedulerInput {
  input: string;
  requestIdRef: MutableValueRef<number>;
  onSetValidation: (result: ValidationResult) => void;
}

export const SOURCE_VALIDATION_DEBOUNCE_MS = 500;

export const startAppSourceValidationScheduler = ({
  input,
  requestIdRef,
  onSetValidation,
}: AppSourceValidationSchedulerInput): (() => void) => {
  let validationTask: ReturnType<typeof runAppSourceValidationRequest> = null;
  const runValidation = () => {
    validationTask = runAppSourceValidationRequest({ input, requestIdRef, onSetValidation });
  };
  const invalidateValidation = () => {
    requestIdRef.current += 1;
    validationTask?.cancel();
  };

  if (isCleanJsonInputEmpty(cleanJsonInput(input))) {
    runValidation();
    return invalidateValidation;
  }

  const timeoutId = setTimeout(runValidation, SOURCE_VALIDATION_DEBOUNCE_MS);

  return () => {
    clearTimeout(timeoutId);
    invalidateValidation();
  };
};
