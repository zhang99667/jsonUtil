import type { ValidationResult } from '../types';
import { ASYNC_VALIDATION_THRESHOLD } from './appAsyncPolicy';
import {
  cleanJsonInput,
  startJsonValidation,
} from './jsonValidation';
import type { MutableValueRef } from './mutableValueRef';

interface AppSourceValidationRequestInput {
  input: string;
  requestIdRef: MutableValueRef<number>;
  onSetValidation: (result: ValidationResult) => void;
}

export const runAppSourceValidationRequest = ({
  input,
  requestIdRef,
  onSetValidation,
}: AppSourceValidationRequestInput): ReturnType<typeof startJsonValidation> | null => {
  const cleanInput = cleanJsonInput(input);

  if (!cleanInput.trim()) {
    requestIdRef.current += 1;
    onSetValidation({ isValid: true });
    return null;
  }

  const requestId = ++requestIdRef.current;
  const validationTask = startJsonValidation(cleanInput, ASYNC_VALIDATION_THRESHOLD, {
    requireContainer: true,
  });

  validationTask.promise.then(result => {
    if (requestId === requestIdRef.current) {
      onSetValidation(result);
    }
  });

  return validationTask;
};
