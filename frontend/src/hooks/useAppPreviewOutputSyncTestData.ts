import type { ValidationResult } from '../types';

export const validResult: ValidationResult = { isValid: true };
export const invalidResult: ValidationResult = { isValid: false, error: 'preview invalid' };
