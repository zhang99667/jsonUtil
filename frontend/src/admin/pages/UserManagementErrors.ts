import { isRecord } from '../../utils/storage';
import { showError } from '../../utils/toast';
import { isAdminRequestError } from '../services/requestErrors';

const isUserFormFieldError = (value: unknown): boolean => (
    isRecord(value)
    && Array.isArray(value.name)
    && value.name.every(item => typeof item === 'string' || typeof item === 'number')
    && Array.isArray(value.errors)
    && value.errors.every(item => typeof item === 'string')
);

export const isUserFormValidationError = (error: unknown): boolean => (
    isRecord(error)
    && isRecord(error.values)
    && typeof error.outOfDate === 'boolean'
    && Array.isArray(error.errorFields)
    && error.errorFields.every(isUserFormFieldError)
);

export const handleUserManagementRequestError = (
    error: unknown,
    fallbackMessage: string,
    actionName: string,
): void => {
    if (isAdminRequestError(error)) return;

    console.error(`${actionName}失败:`, error);
    showError(fallbackMessage);
};
