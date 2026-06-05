import request from './request';
import { LoginFormValues } from '../../types';
import { safeRemoveStorageItem } from '../../utils/storage';

export const login = async (data: LoginFormValues) => {
    return request.post('/auth/login', data);
};

export const logout = () => {
    safeRemoveStorageItem('token');
    window.location.href = '/admin.html';
};
